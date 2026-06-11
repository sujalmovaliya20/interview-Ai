import time
from .groq_client import GroqTranscriptionClient
from .deepgram_client import DeepgramClient
from .circuit_breaker import CircuitBreaker
from .exceptions import WhisperTimeoutError, WhisperAPIError, WhisperRateLimitError, DeepgramError
from .models import TranscriptionResult
from ..config import settings
from ..logger import get_logger

class TranscriptionEngine:
    """Orchestrates Groq + Deepgram with circuit breaker"""
    
    def __init__(self):
        self.groq = GroqTranscriptionClient()
        self.deepgram = DeepgramClient(settings.deepgram_api_key)
        self.circuit_breaker = CircuitBreaker(
            settings.circuit_breaker_threshold,
            settings.circuit_breaker_reset_seconds
        )
        self.logger = get_logger("engine")

    async def transcribe(self, audio_bytes: bytes, language: str | None, session_id: str) -> TranscriptionResult:
        start = time.monotonic()
        
        should_use_fallback = await self.circuit_breaker.should_use_fallback()
        
        if should_use_fallback:
            self.logger.info("circuit_open_using_deepgram", session_id=session_id)
            return await self._deepgram_transcribe(audio_bytes, language, session_id)
        
        try:
            result = await self.groq.transcribe(audio_bytes, language)
            await self.circuit_breaker.record_success()
            latency = (time.monotonic() - start) * 1000
            self.logger.info("groq_success", session_id=session_id, latency_ms=latency)
            return result
            
        except (WhisperTimeoutError, WhisperAPIError) as e:
            await self.circuit_breaker.record_failure()
            self.logger.warning("groq_failed_falling_back", session_id=session_id, error=str(e))
            return await self._deepgram_transcribe(audio_bytes, language, session_id)
            
        except WhisperRateLimitError:
            # Don't count rate limit as circuit breaker failure
            self.logger.warning("groq_rate_limited", session_id=session_id)
            return await self._deepgram_transcribe(audio_bytes, language, session_id)

    async def _deepgram_transcribe(self, audio_bytes, language, session_id) -> TranscriptionResult:
        try:
            return await self.deepgram.transcribe(audio_bytes, language)
        except DeepgramError as e:
            self.logger.error("both_providers_failed", session_id=session_id, error=str(e))
            raise
