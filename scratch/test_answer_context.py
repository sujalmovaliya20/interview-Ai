import sys
import os
import asyncio
from dotenv import load_dotenv

# Load transcription .env before importing config
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription", ".env"))
load_dotenv(env_path)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription")))

import redis.asyncio as aioredis
from app.config import settings
from app.lib.supabase import supabase
from app.answer.engine import AnswerEngine
from app.answer.models import SessionContext, QAPair

class MockRedis:
    async def get(self, key):
        print(f"[MockRedis] GET {key}")
        return None
    async def set(self, key, val, **kwargs):
        print(f"[MockRedis] SET {key} = {val[:50]}...")
        return True
    async def delete(self, *keys):
        print(f"[MockRedis] DELETE {keys}")
        return True
    async def close(self):
        pass

async def main():
    # Initialize mock redis
    redis_client = MockRedis()
    
    # Initialize answer engine
    engine = AnswerEngine(redis_client, supabase)
    
    # Find a real user_id from documents table
    res_users = supabase.table('documents').select('user_id').limit(1).execute()
    users_data = res_users.data if hasattr(res_users, 'data') else res_users.get('data', [])
    if not users_data:
        print("No documents found in database.")
        return
    
    user_id = users_data[0]['user_id']
    print(f"Testing with user_id: {user_id}")
    
    # Mock a session ID
    session_id = "test-session-uuid-1234"
    
    # Also get context and check what's built
    ctx = SessionContext(
        session_id=session_id,
        user_id=user_id,
        model="nvidia",
        language="en",
        extra_context="Stripe system design focus",
        role_hint="Senior Software Engineer",
        history=[]
    )
    
    # Build prompt
    prompt = await engine.context_builder.build_system_prompt(user_id, ctx)
    print("\n--- BUILT SYSTEM PROMPT ---")
    print(prompt)
    print("---------------------------\n")

if __name__ == "__main__":
    asyncio.run(main())
