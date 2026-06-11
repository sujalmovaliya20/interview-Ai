import io
import asyncio
from openai import AsyncOpenAI, APIError, RateLimitError
from .exceptions import WhisperTimeoutError, WhisperAPIError, WhisperRateLimitError
from .models import TranscriptionResult, WordTimestamp
from ..config import settings

class WhisperClient:
    def __init__(self, api_key: str, timeout: float, base_url: str | None = None):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.timeout = timeout

    async def transcribe(self, audio_bytes: bytes, language: str | None = None) -> TranscriptionResult:
        """
        Call OpenAI Whisper API with timeout enforcement.
        Raises: WhisperTimeoutError, WhisperAPIError, WhisperRateLimitError
        """
        try:
            # Create in-memory file-like object
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "audio.wav"
            
            # Start timer for latency tracking
            import time
            start = time.monotonic()

            response = await asyncio.wait_for(
                self.client.audio.transcriptions.create(
                    model=settings.whisper_model,
                    file=audio_file,
                    language=language,
                    response_format="verbose_json"
                ),
                timeout=self.timeout
            )
            
            latency = (time.monotonic() - start) * 1000

            # Parse words
            words = []
            if hasattr(response, 'words') and response.words:
                for w in response.words:
                    words.append(WordTimestamp(
                        word=w.word,
                        start=w.start,
                        end=w.end
                    ))

            return TranscriptionResult(
                text=response.text,
                language_detected=getattr(response, 'language', language or 'en'),
                duration=getattr(response, 'duration', 0.0),
                words=words,
                provider='whisper',
                latency_ms=latency
            )

        except asyncio.TimeoutError:
            raise WhisperTimeoutError("Whisper API timed out")
        except RateLimitError as e:
            raise WhisperRateLimitError(str(e))
        except APIError as e:
            raise WhisperAPIError(str(e))
        except Exception as e:
            raise WhisperAPIError(f"Unexpected error: {str(e)}")
