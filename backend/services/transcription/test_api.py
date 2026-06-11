import asyncio
from app.answer.nvidia_client import NvidiaLLMClient

async def on_token(token: str):
    print(token, end="", flush=True)

async def test():
    client = NvidiaLLMClient("abacusai/dracarys-llama-3.1-70b-instruct")
    try:
        await client.stream_answer("What is the capital of France?", "You are a helpful assistant.", "123", on_token)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
