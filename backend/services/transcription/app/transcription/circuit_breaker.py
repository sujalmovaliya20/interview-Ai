import asyncio
import time
from typing import Literal
from ..logger import get_logger

class CircuitBreaker:
    """
    Tracks Whisper API failures. Switches to Deepgram when threshold hit.
    States: CLOSED (Whisper active) -> OPEN (Deepgram only) -> HALF_OPEN (test Whisper)
    """
    def __init__(self, threshold: int, reset_seconds: int):
        self.threshold = threshold
        self.reset_seconds = reset_seconds
        
        self.state: Literal['closed', 'open', 'half_open'] = 'closed'
        self.failure_count: int = 0
        self.opened_at: float | None = None
        
        self._lock = asyncio.Lock()
        self.logger = get_logger("circuit_breaker")

    async def record_success(self):
        async with self._lock:
            if self.state != 'closed':
                self.logger.info("circuit_breaker_closed", previous_state=self.state)
            self.failure_count = 0
            self.state = 'closed'
            self.opened_at = None

    async def record_failure(self):
        async with self._lock:
            self.failure_count += 1
            if self.failure_count >= self.threshold and self.state == 'closed':
                self.state = 'open'
                self.opened_at = time.monotonic()
                self.logger.warning("circuit_breaker_opened", failure_count=self.failure_count)

    async def should_use_fallback(self) -> bool:
        async with self._lock:
            if self.state == 'closed':
                return False
                
            if self.state == 'open':
                # Check if we should transition to half-open
                if self.opened_at and (time.monotonic() - self.opened_at) > self.reset_seconds:
                    self.state = 'half_open'
                    self.logger.info("circuit_breaker_half_open")
                    return False # Allow one request to test Whisper
                return True # Still open, use fallback
                
            if self.state == 'half_open':
                # In half-open, we only allow one test request through.
                # But since we can't easily track inflight in this simple version, 
                # we'll just let any request pass until success/failure is recorded.
                # A more robust version would limit concurrency here.
                return False

    async def reset_if_expired(self):
        # Already handled in should_use_fallback
        pass
