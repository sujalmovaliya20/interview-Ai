import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.answer.engine import AnswerEngine
from app.answer.models import SessionContext
import json

@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    mock.get.return_value = None
    return mock

@pytest.fixture
def engine(mock_redis):
    e = AnswerEngine(mock_redis)
    e.primary.stream_answer = AsyncMock(return_value="Answer")
    e.fallback.stream_answer = AsyncMock(return_value="Fallback Answer")
    e.context_builder.build_system_prompt = AsyncMock(return_value="Prompt")
    return e

@pytest.mark.asyncio
async def test_process_transcript_not_question(engine):
    await engine.process_transcript("hello", "sess1", "user1", "model", "en")
    # engine._stream_and_publish not called (but it's a task, so we check primary instead)
    engine.primary.stream_answer.assert_not_called()

@pytest.mark.asyncio
async def test_process_transcript_question(engine, mock_redis):
    # Ensure it's treated as a question
    engine.detector.is_question = MagicMock(return_value=True)
    engine.detector.extract_question = MagicMock(return_value="How are you?")
    
    # Needs a mock to await the task properly for testing
    await engine._stream_and_publish("How are you?", "sess1", "user1", "en")
    
    engine.primary.stream_answer.assert_called_once()
    assert mock_redis.publish.call_count == 1
    
    # Check history
    assert "sess1" in engine._history
    assert engine._history["sess1"][0].question == "How are you?"
    assert engine._history["sess1"][0].answer == "Answer"
