import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def main():
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        print("No NVIDIA_API_KEY found")
        return
        
    primary_model = os.environ.get("NVIDIA_PRIMARY_MODEL", "meta/llama-3.1-8b-instruct")
    fallback_model = os.environ.get("NVIDIA_FALLBACK_MODEL", "meta/llama-3.2-3b-instruct")
    
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://integrate.api.nvidia.com/v1"
    )
    
    print(f"Testing primary model ({primary_model})...")
    try:
        response = await client.chat.completions.create(
            model=primary_model,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("Primary OK")
    except Exception as e:
        print(f"Primary error: {e}")

    print(f"\nTesting fallback model ({fallback_model})...")
    try:
        response = await client.chat.completions.create(
            model=fallback_model,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("Fallback OK")
    except Exception as e:
        print(f"Fallback error: {e}")

asyncio.run(main())
