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
        
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://integrate.api.nvidia.com/v1"
    )
    
    print("Testing primary model...")
    try:
        response = await client.chat.completions.create(
            model="abacusai/dracarys-llama-3.1-70b-instruct",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("Primary OK")
    except Exception as e:
        print(f"Primary error: {e}")

    print("\nTesting fallback model...")
    try:
        response = await client.chat.completions.create(
            model="mistralai/mistral-large",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("Fallback OK")
    except Exception as e:
        print(f"Fallback error: {e}")

asyncio.run(main())
