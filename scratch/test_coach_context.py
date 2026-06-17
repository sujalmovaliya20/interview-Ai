import sys
import os
import asyncio
from dotenv import load_dotenv

# Load transcription .env before importing config
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription", ".env"))
load_dotenv(env_path)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription")))

from app.lib.supabase import supabase
from app.agent.coach_agent import coach_runner

async def main():
    try:
        # Find a real user_id from documents table
        print("Finding a real user_id with documents...")
        res_users = supabase.table('documents').select('user_id').limit(1).execute()
        users_data = res_users.data if hasattr(res_users, 'data') else res_users.get('data', [])
        if not users_data:
            print("No documents/users found in database.")
            return
        
        user_id = users_data[0]['user_id']
        print(f"Testing coach agent with user_id: {user_id}")

        # Start a coaching session
        print("\nStarting session for 'Senior Software Engineer'...")
        session_data = await coach_runner.start_session(
            user_id=user_id,
            role="Senior Software Engineer",
            session_type="mixed",
            max_questions=3
        )
        session_id = session_data["session_id"]
        print(f"Session ID created: {session_id}")
        print(f"Opening Question: {session_data['question']}")

        # Retrieve the session state from coach_runner to verify resume_context was set
        state = coach_runner.active_sessions.get(session_id)
        if state and state.get("resume_context"):
            print("\nSUCCESS: Resume context is successfully loaded into LangGraph CoachState!")
            print(f"Resume context snippet: {state['resume_context'][:200]}...")
        else:
            print("\nFAILURE: Resume context was not loaded or is empty in CoachState.")

        # Submit an answer to the coach
        print("\nSubmitting answer to coach...")
        answer = "I have 3 years of experience building scalable react applications and worked on matching ngo donors to volunteer groups using Java and Android Studio."
        response = await coach_runner.submit_answer(session_id, answer)
        
        print("\n--- COACH RESPONSE ---")
        print(f"Feedback: {response['feedback']}")
        print(f"Next Question: {response.get('next_question', 'N/A')}")
        print(f"Overall Score: {response['evaluation']['overall_score']}")
        print(f"Strengths: {response['evaluation']['strengths']}")
        print(f"Improvements: {response['evaluation']['improvements']}")

    except Exception as e:
        print("Error running coach test:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
