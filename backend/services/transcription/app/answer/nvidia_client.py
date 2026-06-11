"""
NVIDIA NIM — OpenAI-compatible endpoint.
Primary model: Llama-3.1-70b-instruct
Fallback model: Mistral-Large
Both via same client — just pass different model string.
"""
from openai import AsyncOpenAI
import asyncio, time
from typing import Callable, Awaitable
from app.config import settings
from app.logger import get_logger

class NvidiaRateLimitError(Exception): pass
class NvidiaAPIError(Exception): pass

class NvidiaLLMClient:
  def __init__(self, model: str):
    self.model = model
    self.client = AsyncOpenAI(
      api_key=settings.nvidia_api_key,
      base_url=settings.nvidia_base_url
    )
    self.logger = get_logger("nvidia_client")

  async def stream_answer(
    self,
    question: str,
    system_prompt: str,
    answer_id: str,
    on_token: Callable[[str], Awaitable[None]]
  ) -> str:
    full_text = ""
    start = time.monotonic()
    
    try:
      stream = await self.client.chat.completions.create(
        model=self.model,
        messages=[
          {"role": "system", "content": system_prompt},
          {"role": "user", "content": question}
        ],
        max_tokens=settings.answer_max_tokens,
        temperature=0.7,
        stream=True,
        timeout=settings.nvidia_timeout_seconds
      )
      async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
          token = chunk.choices[0].delta.content
          full_text += token
          await on_token(token)
      
      latency = (time.monotonic() - start) * 1000
      self.logger.info("nvidia_answer_complete",
        model=self.model, latency_ms=latency,
        answer_id=answer_id, tokens=len(full_text.split()))
      return full_text

    except asyncio.TimeoutError:
      raise
    except Exception as e:
      err = str(e).lower()
      if "rate" in err or "429" in err:
        self.logger.warning("nvidia_rate_limited", model=self.model)
        raise NvidiaRateLimitError(str(e))
      self.logger.error("nvidia_error", model=self.model, error=str(e))
      raise NvidiaAPIError(str(e))
