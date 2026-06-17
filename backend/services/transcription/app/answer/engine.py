import asyncio
import json
import time
import uuid
import redis.asyncio as redis
from typing import Dict, List

from app.config import settings
from app.logger import get_logger
from app.answer.models import SessionContext, QAPair
from app.answer.nvidia_client import NvidiaLLMClient, NvidiaRateLimitError, NvidiaAPIError
from app.answer.context_builder import ContextBuilder
from app.answer.question_detector import QuestionDetector

from typing import Any

class AnswerEngine:
  def __init__(self, redis_client: redis.Redis, supabase_client: Any):
    self.redis = redis_client
    # Primary: Llama 3.1 70B
    self.primary = NvidiaLLMClient(settings.nvidia_primary_model)
    # Fallback: Mistral Large (if primary rate-limited)
    self.fallback = NvidiaLLMClient(settings.nvidia_fallback_model)
    
    from app.docs.cache_manager import DocumentCacheManager
    self.cache_manager = DocumentCacheManager(redis_client, supabase_client)
    self.context_builder = ContextBuilder(self.cache_manager)
    self.detector = QuestionDetector()
    self.logger = get_logger("answer_engine")
    self._history: Dict[str, List[QAPair]] = {}
    self._history_lock = asyncio.Lock()
    # Rate limit tracking per model
    self._primary_rate_limited_until: float = 0

  async def resolve_user_id(self, session_id: str) -> str:
    """
    Resolves user_id for a session_id. Checks Redis first,
    then falls back to querying the sessions table in Supabase.
    Stores the resolved ID in Redis with a 1-hour TTL.
    """
    if not session_id:
      return "unknown_user"
    redis_key = f"session:user_id:{session_id}"
    try:
      cached = await self.redis.get(redis_key)
      if cached:
        val = cached.decode()
        if val and val != "unknown_user":
          return val
    except Exception as e:
      self.logger.warning("redis_get_user_id_failed", session_id=session_id, error=str(e))

    # Fallback to Supabase query
    def _fetch_from_db():
      res = self.cache_manager.supabase_client.table('sessions')\
          .select('user_id')\
          .eq('id', session_id)\
          .single()\
          .execute()
      return res.data if hasattr(res, 'data') else res.get('data', {})

    try:
      data = await asyncio.to_thread(_fetch_from_db)
      if data and data.get('user_id'):
        resolved_id = data['user_id']
        # Cache back to Redis with 1 hour TTL
        try:
          await self.redis.set(redis_key, resolved_id, ex=3600)
        except Exception as re:
          self.logger.warning("redis_set_user_id_failed", session_id=session_id, error=str(re))
        self.logger.info("resolved_user_id_from_db", session_id=session_id, user_id=resolved_id)
        return resolved_id
    except Exception as e:
      self.logger.error("resolve_user_id_failed", session_id=session_id, error=str(e))
    
    return "unknown_user"

  async def process_transcript(self, text: str, session_id: str, user_id: str, model: str, language: str):
    if not self.detector.is_question(text):
      return
    question = self.detector.extract_question(text)
    self.logger.info("question_detected", session_id=session_id, q=question[:80])
    asyncio.create_task(
      self._stream_and_publish(question, session_id, user_id, language)
    )

  async def _stream_and_publish(self, question: str, session_id: str, user_id: str, language: str):
    if not user_id or user_id == "unknown_user":
      user_id = await self.resolve_user_id(session_id)

    answer_id = str(uuid.uuid4())
    history = self._history.get(session_id, [])
    extra_context = await self._get_extra_context(session_id)
    role_hint = await self._extract_role_hint(session_id)

    session_ctx = SessionContext(
      session_id=session_id,
      user_id=user_id,
      model="nvidia",  # model field now indicates provider
      language=language,
      extra_context=extra_context,
      role_hint=role_hint,
      history=history
    )

    system_prompt = await self.context_builder.build_system_prompt(user_id, session_ctx)

    # Choose client: use fallback if primary rate limited
    now = time.monotonic()
    use_fallback = now < self._primary_rate_limited_until
    client = self.fallback if use_fallback else self.primary
    model_name = settings.nvidia_fallback_model if use_fallback else settings.nvidia_primary_model

    async def on_token(token: str):
      await self.redis.publish(f"answers:{session_id}", json.dumps({
        "type": "answer_delta",
        "sessionId": session_id,
        "answerId": answer_id,
        "text": token,
        "isStreaming": True,
        "modelUsed": model_name,
        "timestamp": int(time.time() * 1000)
      }))

    try:
      full_answer = await client.stream_answer(question, system_prompt, answer_id, on_token)
      await self.redis.publish(f"answers:{session_id}", json.dumps({
        "type": "answer_done",
        "sessionId": session_id,
        "answerId": answer_id,
        "isStreaming": False,
        "timestamp": int(time.time() * 1000)
      }))
      await self._append_history(session_id, question, full_answer)
      self.logger.info("answer_complete", session_id=session_id,
        model=model_name, tokens=len(full_answer.split()))

    except (NvidiaRateLimitError, NvidiaAPIError) as api_err:
      if not use_fallback:
        # Primary rate limited or degraded — switch to fallback for 60s
        self._primary_rate_limited_until = time.monotonic() + 60
        self.logger.warning("primary_api_error_switching_fallback", session_id=session_id, error=str(api_err))
        # Retry with fallback
        try:
          full_answer = await self.fallback.stream_answer(question, system_prompt, answer_id, on_token)
          await self._append_history(session_id, question, full_answer)
        except Exception as e2:
          self.logger.error("fallback_api_error", session_id=session_id, error=str(e2))
          await self._publish_answer_error(session_id, answer_id, "Both primary and fallback AI models are currently busy. Please try asking again.")
      else:
        await self._publish_answer_error(session_id, answer_id, "AI models are currently busy. Please wait a few seconds and try again.")

    except asyncio.TimeoutError:
      self.logger.error("answer_timeout", session_id=session_id)
      await self._publish_answer_error(session_id, answer_id, "Answer timed out. Try a shorter question.")

    except Exception as e:
      error_str = str(e) or repr(e) or "Unknown answer error"
      if error_str == "Exception()":
          error_str = "Unknown answer error"
      self.logger.error("answer_error", session_id=session_id, error=error_str)
      await self._publish_answer_error(session_id, answer_id, error_str)

  async def _append_history(self, session_id: str, question: str, answer: str):
    async with self._history_lock:
        if session_id not in self._history:
            self._history[session_id] = []
        self._history[session_id].append(QAPair(question=question, answer=answer))
        # Keep last 10 pairs
        if len(self._history[session_id]) > 10:
            self._history[session_id] = self._history[session_id][-10:]

  async def _extract_role_hint(self, session_id: str) -> str | None:
      val = await self.redis.get(f"session:role_hint:{session_id}")
      return val.decode() if val else None

  async def _get_extra_context(self, session_id: str) -> str | None:
      val = await self.redis.get(f"session:extra_context:{session_id}")
      return val.decode() if val else None

  async def _publish_answer_error(self, session_id: str, answer_id: str, error: str):
      payload = {
          "type": "answer_error",
          "sessionId": session_id,
          "answerId": answer_id,
          "error": error,
          "timestamp": int(time.time() * 1000)
      }
      await self.redis.publish(f"answers:{session_id}", json.dumps(payload))

  async def cleanup_session(self, session_id: str):
      async with self._history_lock:
          if session_id in self._history:
              del self._history[session_id]
