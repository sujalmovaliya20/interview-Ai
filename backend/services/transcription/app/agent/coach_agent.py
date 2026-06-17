"""
AI Interview Coach Agent using LangGraph.
Graph: start → generate_question → evaluate_answer → give_feedback
       → generate_followup → next_question (loop) → end_session
"""

import asyncio
import json
import time
import uuid
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from openai import AsyncOpenAI
from mem0 import AsyncMemoryClient
from app.config import settings
from app.lib.supabase import supabase
from app.logger import get_logger

logger = get_logger("coach_agent")

# ── STATE ──
class CoachState(TypedDict):
  session_id: str
  user_id: str
  role: str
  session_type: str           # behavioral, technical, mixed, rapid_fire
  questions_asked: int
  max_questions: int          # default 10
  current_question: str
  current_question_id: str | None
  current_answer: str
  evaluation: dict | None
  feedback: str
  next_question: str
  conversation_history: list
  user_memories: list         # from Mem0
  overall_scores: list        # collect per answer
  status: Literal["active", "completed", "error"]
  resume_context: str         # candidate resume context if uploaded

# ── NVIDIA CLIENT ──
def get_llm_client() -> AsyncOpenAI:
  return AsyncOpenAI(
    api_key=settings.nvidia_api_key,
    base_url=settings.nvidia_base_url
  )

# ── MEM0 CLIENT DUMMY FALLBACK ──
class DummyMem0Client:
  async def add(self, *args, **kwargs):
    logger.warning("Mem0 API Key is empty. Skipping memory add.")
    return {"results": []}

  async def search(self, *args, **kwargs):
    logger.warning("Mem0 API Key is empty. Skipping memory search.")
    return {"results": []}

def get_mem0_client():
  if not settings.mem0_api_key:
    return DummyMem0Client()
  try:
    return AsyncMemoryClient(api_key=settings.mem0_api_key)
  except Exception as e:
    logger.error("mem0_init_failed_using_dummy", error=str(e))
    return DummyMem0Client()

# ── EMBEDDING ──
async def embed_text(text: str) -> list[float]:
  client = get_llm_client()
  resp = await client.embeddings.create(
    model="nvidia/llama-nemotron-embed-1b-v2",
    input=text,
    encoding_format="float",
    extra_body={"input_type": "query"}
  )
  return resp.data[0].embedding


async def get_user_resume_context(user_id: str) -> str:
  """
  Helper to retrieve candidate resume text from Supabase documents table.
  Runs query in executor to avoid blocking FastAPI event loop.
  """
  if not user_id or user_id == "unknown_user":
    return ""

  def _fetch():
    res = supabase.table('documents')\
        .select('extracted_text')\
        .eq('user_id', user_id)\
        .eq('is_resume', True)\
        .not_.is_('extracted_text', 'null')\
        .order('created_at', desc=True)\
        .limit(1)\
        .execute()
    return res.data if hasattr(res, 'data') else res.get('data', [])

  try:
    data = await asyncio.to_thread(_fetch)
    if data and data[0].get('extracted_text'):
      return data[0]['extracted_text']
  except Exception as e:
    logger.error("failed_to_fetch_resume_context", user_id=user_id, error=str(e))
  return ""

# ── NODE 1: GENERATE OPENING QUESTION ──
async def generate_question_node(state: CoachState) -> CoachState:
  logger.info("generate_question", session_id=state["session_id"],
    q_count=state["questions_asked"])

  client = get_llm_client()
  user_memories = state.get("user_memories", [])

  # Build memory context for personalization
  memory_context = ""
  if user_memories:
    memory_context = "USER HISTORY:\n" + "\n".join(
      f"- {m['memory']}" for m in user_memories[:5]
    )

  # Find best next question from pgvector
  if state["questions_asked"] > 0 and state.get("evaluation"):
    # Target weak areas from last answer
    weak_categories = state["evaluation"].get("weak_categories", [])
    if weak_categories:
      try:
        embedding = await embed_text(
          f"practice question for weakness: {', '.join(weak_categories)}"
        )
        def _match():
          return supabase.rpc("match_questions", {
            "query_embedding": embedding,
            "match_count": 5,
            "filter_category": weak_categories[0] if weak_categories else None
          }).execute()
        result = await asyncio.to_thread(_match)
        if result.data:
          q = result.data[0]
          return {**state,
            "current_question": q["text"],
            "current_question_id": q["id"]
          }
      except Exception as e:
        logger.error("rpc_match_questions_failed", error=str(e))

  # Generate question via LLM if no good match
  resume_context_str = ""
  if state.get("resume_context"):
    resume_context_str = f"CANDIDATE RESUME/BACKGROUND:\n{state['resume_context']}\n"

  prompt = f"""You are an expert interviewer conducting a {state["session_type"]} interview
for a {state["role"]} position.

{resume_context_str}
{memory_context}

Questions asked so far: {state["questions_asked"]}
Conversation so far: {json.dumps(state["conversation_history"][-4:], indent=2)}

Generate the next most appropriate interview question.
- If early in interview (q1-3): start with warm-up behavioral questions
- If mid interview (q4-7): go deeper, more challenging
- If late (q8-10): hardest questions, test limits
- Target areas where user showed weakness based on history
- Tailor the question specifically to the candidate's skills and projects listed in their resume if provided.

Return ONLY the question text. No preamble."""

  response = await client.chat.completions.create(
    model=settings.nvidia_primary_model,
    messages=[{"role": "user", "content": prompt}],
    max_tokens=200,
    temperature=0.7
  )
  question = response.choices[0].message.content.strip()
  return {**state, "current_question": question, "current_question_id": None}

# ── NODE 2: EVALUATE ANSWER ──
async def evaluate_answer_node(state: CoachState) -> CoachState:
  logger.info("evaluate_answer", session_id=state["session_id"])
  client = get_llm_client()

  resume_context_str = ""
  if state.get("resume_context"):
    resume_context_str = f"CANDIDATE RESUME/BACKGROUND:\n{state['resume_context']}\n"

  eval_prompt = f"""You are an expert interview evaluator. Evaluate this answer strictly and fairly.

{resume_context_str}
QUESTION: {state["current_question"]}
ANSWER: {state["current_answer"]}
ROLE CONTEXT: {state["role"]}

Score each dimension 0-10 and provide specific feedback. Evaluate the response appropriately given the candidate's experience level and details in their resume.
Return ONLY valid JSON:
{{
  "star_score": <0-10>,
  "clarity_score": <0-10>,
  "technical_score": <0-10>,
  "confidence_score": <0-10>,
  "overall_score": <0-10>,
  "filler_words_detected": ["um", "like", ...],
  "filler_word_count": <int>,
  "missing_points": ["what they should have mentioned"],
  "strengths_in_answer": ["what they did well"],
  "improvements": ["specific things to improve"],
  "weak_categories": ["behavioral", "technical", etc],
  "follow_up_question": "a follow-up question based on their answer"
}}"""

  response = await client.chat.completions.create(
    model=settings.nvidia_primary_model,
    messages=[{"role": "user", "content": eval_prompt}],
    max_tokens=600,
    temperature=0.3  # low temp for consistent evaluation
  )

  try:
    raw = response.choices[0].message.content
    clean = raw.replace("```json", "").replace("```", "").strip()
    evaluation = json.loads(clean)
  except json.JSONDecodeError:
    logger.error("json_parse_failed", raw_response=response.choices[0].message.content)
    evaluation = {
      "overall_score": 5.0, "star_score": 5.0,
      "clarity_score": 5.0, "technical_score": 5.0,
      "confidence_score": 5.0, "filler_word_count": 0,
      "filler_words_detected": [], "missing_points": [],
      "strengths_in_answer": [], "improvements": [],
      "weak_categories": [], "follow_up_question": ""
    }

  # Save answer to DB
  try:
    # Optional embedding generation for user's answer
    ans_embedding = None
    try:
      ans_embedding = await embed_text(state["current_answer"])
    except Exception as emb_e:
      logger.warning("failed_to_embed_answer", error=str(emb_e))

    def _save_answer():
      return supabase.table("coach_answers").insert({
        "session_id": state["session_id"],
        "user_id": state["user_id"],
        "question_id": state.get("current_question_id"),
        "question_text": state["current_question"],
        "answer_text": state["current_answer"],
        "star_score": evaluation.get("star_score"),
        "clarity_score": evaluation.get("clarity_score"),
        "technical_score": evaluation.get("technical_score"),
        "confidence_score": evaluation.get("confidence_score"),
        "overall_score": evaluation.get("overall_score"),
        "filler_word_count": evaluation.get("filler_word_count", 0),
        "filler_words_detected": evaluation.get("filler_words_detected", []),
        "missing_points": evaluation.get("missing_points", []),
        "strengths_in_answer": evaluation.get("strengths_in_answer", []),
        "improvements": evaluation.get("improvements", []),
        "feedback_text": "",
        "follow_up_asked": evaluation.get("follow_up_question", ""),
        "embedding": ans_embedding
      }).execute()
    
    await asyncio.to_thread(_save_answer)
  except Exception as db_e:
    logger.error("failed_to_save_coach_answer", error=str(db_e))

  # Upsert weakness records to user_weaknesses table
  try:
    weak_categories = evaluation.get("weak_categories", [])
    improvements = evaluation.get("improvements", [])
    if weak_categories and improvements:
      for category in weak_categories:
        for improvement in improvements[:2]: # only track top 2 to avoid spam
          # Select existing weakness to see if we can increment occurrence_count
          def _get_weakness():
            return supabase.table("user_weaknesses").select("id, occurrence_count").eq("user_id", state["user_id"]).eq("category", category).eq("weakness_description", improvement).execute()
          existing = await asyncio.to_thread(_get_weakness)
          if existing.data:
            weak_id = existing.data[0]["id"]
            count = existing.data[0]["occurrence_count"] + 1
            def _update_weakness():
              return supabase.table("user_weaknesses").update({"occurrence_count": count, "last_seen_at": "now()"}).eq("id", weak_id).execute()
            await asyncio.to_thread(_update_weakness)
          else:
            def _insert_weakness():
              return supabase.table("user_weaknesses").insert({
                "user_id": state["user_id"],
                "category": category,
                "weakness_description": improvement,
                "occurrence_count": 1
              }).execute()
            await asyncio.to_thread(_insert_weakness)
  except Exception as weak_db_e:
    logger.error("failed_to_track_weaknesses_db", error=str(weak_db_e))

  new_scores = state.get("overall_scores", []) + [evaluation.get("overall_score", 5)]
  return {**state, "evaluation": evaluation, "overall_scores": new_scores}

# ── NODE 3: GENERATE FEEDBACK ──
async def generate_feedback_node(state: CoachState) -> CoachState:
  logger.info("generate_feedback", session_id=state["session_id"])
  client = get_llm_client()
  ev = state["evaluation"]

  feedback_prompt = f"""You are a supportive but honest interview coach.
Give constructive feedback on this answer. Be specific, actionable, encouraging.

QUESTION: {state["current_question"]}
ANSWER: {state["current_answer"]}
EVALUATION: {json.dumps(ev, indent=2)}

Write feedback in this structure:
1. What you did well (1-2 sentences, specific)
2. What to improve (2-3 specific actionable points)
3. How to say it better (give a 1-sentence example of stronger phrasing)

Keep it under 150 words. Speak directly to the candidate: "You did..." "Next time, try..."
Do NOT be generic. Reference what they actually said."""

  response = await client.chat.completions.create(
    model=settings.nvidia_primary_model,
    messages=[{"role": "user", "content": feedback_prompt}],
    max_tokens=300,
    temperature=0.7
  )
  feedback = response.choices[0].message.content.strip()

  # Update feedback_text in the latest coach_answers row for this session
  try:
    def _get_latest_ans():
      return supabase.table("coach_answers").select("id").eq("session_id", state["session_id"]).order("created_at", desc=True).limit(1).execute()
    latest_answer = await asyncio.to_thread(_get_latest_ans)
    if latest_answer.data:
      def _update_feedback():
        return supabase.table("coach_answers").update({"feedback_text": feedback}).eq("id", latest_answer.data[0]["id"]).execute()
      await asyncio.to_thread(_update_feedback)
  except Exception as db_err:
    logger.error("failed_to_update_feedback_text", error=str(db_err))

  # Store memory in Mem0 — persistent across sessions
  mem0 = get_mem0_client()
  if ev.get("weak_categories"):
    for weakness in ev["weak_categories"]:
      try:
        await mem0.add(
          messages=[{
            "role": "assistant",
            "content": f"User showed weakness in: {weakness}. Missing points: {ev.get('missing_points', [])}. Filler words: {ev.get('filler_word_count', 0)}"
          }],
          user_id=state["user_id"]
        )
      except Exception as m_e:
        logger.error("failed_to_save_mem0_memory", error=str(m_e))

  return {**state, "feedback": feedback}

# ── ROUTER: continue or end ──
def should_continue(state: CoachState) -> Literal["generate_question", "end_session"]:
  if state["questions_asked"] >= state["max_questions"]:
    return "end_session"
  if state["status"] == "completed":
    return "end_session"
  return "generate_question"

# ── NODE 4: END SESSION + REPORT ──
async def end_session_node(state: CoachState) -> CoachState:
  logger.info("end_session", session_id=state["session_id"])
  client = get_llm_client()

  scores = state.get("overall_scores", [5.0])
  avg_score = sum(scores) / len(scores) if scores else 5.0

  # Get all answers for this session for report generation
  def _get_answers():
    return supabase.table("coach_answers")\
      .select("*")\
      .eq("session_id", state["session_id"])\
      .execute()
  answers_result = await asyncio.to_thread(_get_answers)
  answers = answers_result.data or []

  # Aggregate weaknesses
  all_weaknesses = []
  all_strengths = []
  for ans in answers:
    all_weaknesses.extend(ans.get("improvements", []))
    all_strengths.extend(ans.get("strengths_in_answer", []))

  report_prompt = f"""Generate a comprehensive interview performance report.

ROLE: {state["role"]}
SESSION TYPE: {state["session_type"]}
QUESTIONS ANSWERED: {len(answers)}
AVERAGE SCORE: {avg_score:.1f}/10
ALL WEAKNESSES NOTED: {json.dumps(list(set(all_weaknesses))[:10])}
ALL STRENGTHS NOTED: {json.dumps(list(set(all_strengths))[:10])}

Return ONLY valid JSON:
{{
  "overall_score": {avg_score:.1f},
  "performance_level": "Beginner|Developing|Competent|Proficient|Expert",
  "top_strengths": ["strength 1", "strength 2", "strength 3"],
  "top_weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "priority_improvements": [
    {{"area": "...", "why": "...", "how_to_improve": "..."}}
  ],
  "recommended_practice": ["topic 1", "topic 2"],
  "interview_readiness": "Not Ready|Almost Ready|Ready|Highly Ready",
  "summary": "2-3 sentence overall assessment"
}}"""

  response = await client.chat.completions.create(
    model=settings.nvidia_primary_model,
    messages=[{"role": "user", "content": report_prompt}],
    max_tokens=800,
    temperature=0.3
  )

  try:
    raw = response.choices[0].message.content
    report = json.loads(raw.replace("```json","").replace("```","").strip())
  except Exception as rep_err:
    logger.error("failed_to_parse_report_json", error=str(rep_err))
    report = {"overall_score": avg_score, "summary": "Session completed successfully."}

  # Update session in DB
  try:
    def _update_session():
      return supabase.table("coach_sessions").update({
        "status": "completed",
        "overall_score": avg_score,
        "strengths": report.get("top_strengths", []),
        "weaknesses": report.get("top_weaknesses", []),
        "report": report,
        "ended_at": "now()",
        "questions_answered": len(answers)
      }).eq("id", state["session_id"]).execute()
    await asyncio.to_thread(_update_session)
  except Exception as db_e:
    logger.error("failed_to_update_coach_session_completed", error=str(db_e))

  return {**state, "status": "completed", "evaluation": {"report": report}}

# ── ROUTER ENTRY NODE ──
def router_entry_node(state: CoachState) -> CoachState:
  return state

def route_from_entry(state: CoachState) -> Literal["generate_question", "evaluate_answer"]:
  # If we have no answer and questions_asked is 0, we just started and need the first question
  if not state.get("current_answer") and state["questions_asked"] == 0:
    return "generate_question"
  else:
    return "evaluate_answer"

# ── BUILD THE GRAPH ──
def build_coach_graph() -> StateGraph:
  graph = StateGraph(CoachState)

  graph.add_node("router_entry", router_entry_node)
  graph.add_node("generate_question", generate_question_node)
  graph.add_node("evaluate_answer", evaluate_answer_node)
  graph.add_node("generate_feedback", generate_feedback_node)
  graph.add_node("end_session", end_session_node)

  graph.set_entry_point("router_entry")
  
  graph.add_conditional_edges(
    "router_entry",
    route_from_entry,
    {
      "generate_question": "generate_question",
      "evaluate_answer": "evaluate_answer"
    }
  )

  # When a question is generated, we stop the turn and wait for user answer
  graph.add_edge("generate_question", END)
  
  graph.add_edge("evaluate_answer", "generate_feedback")
  graph.add_conditional_edges(
    "generate_feedback",
    should_continue,
    {
      "generate_question": "generate_question",
      "end_session": "end_session"
    }
  )
  graph.add_edge("end_session", END)

  return graph.compile()

# ── ENTRY POINT ──
class CoachAgentRunner:
  def __init__(self):
    self.graph = build_coach_graph()
    self.active_sessions: dict[str, CoachState] = {}

  async def start_session(
    self, user_id: str, role: str,
    session_type: str = "mixed", max_questions: int = 10
  ) -> dict:
    # Create DB session
    def _create_session():
      return supabase.table("coach_sessions").insert({
        "user_id": user_id, "role": role,
        "session_type": session_type, "status": "active"
      }).execute()
    result = await asyncio.to_thread(_create_session)
    session_id = result.data[0]["id"]

    # Load user memories from Mem0
    memories = []
    try:
      mem0 = get_mem0_client()
      memories_result = await mem0.search(
        query=f"interview preparation for {role}",
        user_id=user_id, limit=10
      )
      memories = memories_result.get("results", [])
    except Exception as mem_err:
      logger.error("mem0_search_failed", error=str(mem_err))

    # Fetch resume text asynchronously
    resume_text = await get_user_resume_context(user_id)

    # Initialize state
    initial_state: CoachState = {
      "session_id": session_id,
      "user_id": user_id,
      "role": role,
      "session_type": session_type,
      "questions_asked": 0,
      "max_questions": max_questions,
      "current_question": "",
      "current_question_id": None,
      "current_answer": "",
      "evaluation": None,
      "feedback": "",
      "next_question": "",
      "conversation_history": [],
      "user_memories": memories,
      "overall_scores": [],
      "status": "active",
      "resume_context": resume_text
    }
    self.active_sessions[session_id] = initial_state

    # Run first question generation
    state = await self.graph.ainvoke(
      initial_state,
      config={"recursion_limit": 10}
      # Route via entry_router to generate_question and stop
    )
    self.active_sessions[session_id] = state

    return {
      "session_id": session_id,
      "question": state["current_question"],
      "question_number": 1,
      "total_questions": max_questions,
      "memories_loaded": len(memories)
    }

  async def submit_answer(self, session_id: str, answer_text: str) -> dict:
    state = self.active_sessions.get(session_id)
    if not state:
      # If not in local active_sessions memory, load from DB
      try:
        def _get_session():
          return supabase.table("coach_sessions").select("*").eq("id", session_id).single().execute()
        session_db = await asyncio.to_thread(_get_session)
        if not session_db.data:
          raise ValueError(f"Session {session_id} not found in database")
        
        def _get_answers_db():
          return supabase.table("coach_answers").select("*").eq("session_id", session_id).execute()
        answers_db = await asyncio.to_thread(_get_answers_db)
        answers = answers_db.data or []
        
        conversation_history = []
        overall_scores = []
        for ans in answers:
          conversation_history.append({
            "question": ans["question_text"],
            "answer": ans["answer_text"]
          })
          overall_scores.append(float(ans["overall_score"]))

        user_id = session_db.data["user_id"]
        resume_text = await get_user_resume_context(user_id)
        latest_ans = answers[-1] if answers else None

        state = {
          "session_id": session_id,
          "user_id": user_id,
          "role": session_db.data["role"],
          "session_type": session_db.data["session_type"],
          "questions_asked": len(answers),
          "max_questions": 10, # default fallback
          "current_question": latest_ans["follow_up_asked"] if (latest_ans and latest_ans.get("follow_up_asked")) else "",
          "current_question_id": None,
          "current_answer": "",
          "evaluation": None,
          "feedback": "",
          "next_question": "",
          "conversation_history": conversation_history,
          "user_memories": [],
          "overall_scores": overall_scores,
          "status": session_db.data["status"],
          "resume_context": resume_text
        }
      except Exception as db_err:
        raise ValueError(f"Session {session_id} not found: {str(db_err)}")

    # Ensure resume_context exists in loaded state
    if state and "resume_context" not in state:
      state["resume_context"] = await get_user_resume_context(state["user_id"])

    # Update state with answer
    state["current_answer"] = answer_text
    state["questions_asked"] += 1
    state["conversation_history"].append({
      "question": state["current_question"],
      "answer": answer_text
    })

    # Update questions_asked in DB
    try:
      def _update_q_count():
        return supabase.table("coach_sessions").update({
          "questions_asked": state["questions_asked"]
        }).eq("id", session_id).execute()
      await asyncio.to_thread(_update_q_count)
    except Exception as q_db_e:
      logger.error("failed_to_update_questions_asked", error=str(q_db_e))

    # Run evaluate → feedback → next_question nodes
    new_state = await self.graph.ainvoke(
      state,
      config={"recursion_limit": 10}
    )
    self.active_sessions[session_id] = new_state

    response = {
      "feedback": new_state["feedback"],
      "evaluation": {
        "overall_score": new_state["evaluation"].get("overall_score"),
        "star_score": new_state["evaluation"].get("star_score"),
        "clarity_score": new_state["evaluation"].get("clarity_score"),
        "technical_score": new_state["evaluation"].get("technical_score"),
        "confidence_score": new_state["evaluation"].get("confidence_score"),
        "strengths": new_state["evaluation"].get("strengths_in_answer", []),
        "improvements": new_state["evaluation"].get("improvements", []),
        "filler_words": new_state["evaluation"].get("filler_word_count", 0)
      },
      "session_complete": new_state["status"] == "completed"
    }

    if new_state["status"] == "completed":
      response["report"] = new_state["evaluation"].get("report", {})
      if session_id in self.active_sessions:
        del self.active_sessions[session_id]
    else:
      response["next_question"] = new_state["current_question"]
      response["question_number"] = new_state["questions_asked"] + 1

    return response

coach_runner = CoachAgentRunner()  # singleton
