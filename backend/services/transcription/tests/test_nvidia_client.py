import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.answer.nvidia_client import NvidiaLLMClient, NvidiaRateLimitError, NvidiaAPIError
from openai import AsyncOpenAI
import time

@pytest.fixture
def mock_openai_response():
    class MockDelta:
        def __init__(self, content):
            self.content = content
            
    class MockChoice:
        def __init__(self, content):
            self.delta = MockDelta(content)
            
    class MockChunk:
        def __init__(self, content):
            self.choices = [MockChoice(content)]
            
    async def mock_stream():
        yield MockChunk("Hello")
        yield MockChunk(" World")
        
    return mock_stream()

@pytest.mark.asyncio
async def test_nvidia_client_stream(mock_openai_response):
    client = NvidiaLLMClient("test-model")
    
    # Mock the AsyncOpenAI client
    mock_chat = AsyncMock()
    mock_chat.completions.create.return_value = mock_openai_response
    client.client.chat = mock_chat
    
    tokens = []
    async def on_token(token):
        tokens.append(token)
        
    full_text = await client.stream_answer("q", "system", "id1", on_token)
    assert full_text == "Hello World"
    assert tokens == ["Hello", " World"]

@pytest.mark.asyncio
async def test_nvidia_rate_limit():
    client = NvidiaLLMClient("test-model")
    
    # Mock the AsyncOpenAI client to raise an exception
    mock_chat = AsyncMock()
    mock_chat.completions.create.side_effect = Exception("rate limit 429")
    client.client.chat = mock_chat
    
    async def on_token(token):
        pass
        
    with pytest.raises(NvidiaRateLimitError):
        await client.stream_answer("q", "system", "id1", on_token)
