from openai import AsyncOpenAI
import asyncio, io, time
from app.config import settings
from app.transcription.models import TranscriptionResult, WordTimestamp
from app.transcription.exceptions import WhisperTimeoutError, WhisperAPIError, WhisperRateLimitError
from app.logger import get_logger

class GroqTranscriptionClient:
  """
  Groq Whisper-large-v3. OpenAI-compatible endpoint.
  Faster than OpenAI Whisper, free tier, same API shape.
  """
  def __init__(self):
    self.client = AsyncOpenAI(
      api_key=settings.groq_api_key,
      base_url=settings.groq_base_url
    )
    self.logger = get_logger("groq_client")

  async def transcribe(
    self,
    audio_bytes: bytes,
    language: str | None = None
  ) -> TranscriptionResult:
    start = time.monotonic()
    try:
      response = await asyncio.wait_for(
        self.client.audio.transcriptions.create(
          model=settings.groq_whisper_model,
          file=("audio.wav", audio_bytes, "audio/wav"),
          language=language,
          response_format="verbose_json",
          temperature=0.0
        ),
        timeout=settings.groq_timeout_seconds
      )
      latency_ms = (time.monotonic() - start) * 1000
      # verbose_json gives words with timestamps
      words = []
      if hasattr(response, 'words') and response.words:
        words = [
          WordTimestamp(word=w.word, start=w.start, end=w.end)
          for w in response.words
        ]
      text = response.text.strip()
      
      # Filter common Whisper hallucinations on silence
      hallucinations = [
          "thank you for watching", "thank you.", "subtitles by amara.org", 
          "i don't know what to say", "please subscribe", "you", "mock script"
      ]
      if any(text.lower().strip() == h or text.lower().strip() == f"[{h}]" for h in hallucinations) or text.lower().replace(".", "").strip() in ["thank you", "thanks", "subscribe"]:
          text = ""
          words = []

      return TranscriptionResult(
        text=text,
        language_detected=getattr(response, 'language', language) or "en",
        duration=getattr(response, 'duration', 0.0) or 0.0,
        words=words,
        provider="groq",
        latency_ms=latency_ms
      )
    except asyncio.TimeoutError:
      raise WhisperTimeoutError(f"Groq transcription timed out after {settings.groq_timeout_seconds}s")
    except Exception as e:
      err = str(e).lower()
      if "rate" in err or "429" in err:
        raise WhisperRateLimitError(str(e))
      raise WhisperAPIError(str(e))
