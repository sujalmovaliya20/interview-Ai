import pytest
import asyncio
from app.transcription.circuit_breaker import CircuitBreaker

@pytest.mark.asyncio
async def test_initial_state_closed():
    cb = CircuitBreaker(threshold=3, reset_seconds=60)
    assert cb.state == 'closed'
    assert await cb.should_use_fallback() == False

@pytest.mark.asyncio
async def test_opens_after_threshold():
    cb = CircuitBreaker(threshold=3, reset_seconds=60)
    
    await cb.record_failure()
    await cb.record_failure()
    assert cb.state == 'closed'
    assert await cb.should_use_fallback() == False
    
    await cb.record_failure()
    assert cb.state == 'open'
    assert await cb.should_use_fallback() == True

@pytest.mark.asyncio
async def test_resets_after_timeout():
    cb = CircuitBreaker(threshold=2, reset_seconds=1)
    await cb.record_failure()
    await cb.record_failure()
    assert cb.state == 'open'
    
    # Wait for reset timeout
    await asyncio.sleep(1.1)
    
    # First request after timeout should switch to half_open and return False
    assert await cb.should_use_fallback() == False
    assert cb.state == 'half_open'

@pytest.mark.asyncio
async def test_half_open_state():
    cb = CircuitBreaker(threshold=1, reset_seconds=1)
    await cb.record_failure()
    await asyncio.sleep(1.1)
    
    # Switch to half open
    await cb.should_use_fallback()
    assert cb.state == 'half_open'
    
    # Record success -> closed
    await cb.record_success()
    assert cb.state == 'closed'
    assert cb.failure_count == 0
