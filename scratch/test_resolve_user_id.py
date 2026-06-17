import sys
import os
import asyncio
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription", ".env"))
load_dotenv(env_path)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription")))

from app.lib.supabase import supabase
from app.answer.engine import AnswerEngine

class MockRedis:
    def __init__(self):
        self.store = {}
    async def get(self, key):
        print(f"[MockRedis] GET {key}")
        return self.store.get(key)
    async def set(self, key, val, **kwargs):
        print(f"[MockRedis] SET {key} = {val[:50]}...")
        self.store[key] = val.encode() if isinstance(val, str) else val
        return True
    async def delete(self, *keys):
        print(f"[MockRedis] DELETE {keys}")
        return True
    async def close(self):
        pass

async def main():
    try:
        redis_client = MockRedis()
        engine = AnswerEngine(redis_client, supabase)

        # Real session ID from Sujal's latest session in the database
        session_id = "72e5a110-869e-40c9-82f0-08f950ad515f"
        print(f"Testing resolve_user_id for session: {session_id}")
        
        # Test user ID resolution
        user_id = await engine.resolve_user_id(session_id)
        print(f"Resolved User ID: {user_id}")

        if user_id == "unknown_user":
            print("FAILURE: Could not resolve user ID from sessions table.")
            return

        # Test resume context loading
        print(f"Loading resume context for resolved user: {user_id}")
        resume_context = await engine.cache_manager.get_or_build_resume_context(user_id)
        print(f"Resume context length: {len(resume_context)}")
        if resume_context:
            print("SUCCESS: Resume context fetched successfully!")
            print(f"Preview: {resume_context[:200]}...")
        else:
            print("FAILURE: Resume context is empty.")

    except Exception as e:
        print("Error during diagnostic:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
