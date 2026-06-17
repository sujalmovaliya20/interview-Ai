import sys
import os
import asyncio
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription", ".env"))
load_dotenv(env_path)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription")))

import redis.asyncio as aioredis
from app.config import settings

async def main():
    try:
        redis_client = aioredis.from_url("redis://127.0.0.1:6379")
        user_id = "b4ffdc99-9413-4ed3-9e67-81c29b8a0397"
        
        # Check resume key
        resume_key = f"resume:text:{user_id}"
        resume_val = await redis_client.get(resume_key)
        if resume_val is not None:
            print(f"Redis key '{resume_key}' exists. Length: {len(resume_val)}")
            print(f"Value preview: {resume_val[:200]}")
        else:
            print(f"Redis key '{resume_key}' DOES NOT exist.")

        # Check docs key
        docs_key = f"docs:context:{user_id}"
        docs_val = await redis_client.get(docs_key)
        if docs_val is not None:
            print(f"Redis key '{docs_key}' exists. Length: {len(docs_val)}")
            print(f"Value preview: {docs_val[:200]}")
        else:
            print(f"Redis key '{docs_key}' DOES NOT exist.")
            
        await redis_client.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
