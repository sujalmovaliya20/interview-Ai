import pytest
from unittest.mock import AsyncMock, MagicMock
from app.docs.cache_manager import DocumentCacheManager
from app.docs.utils import count_tokens

@pytest.fixture
def mock_redis():
    return AsyncMock()

@pytest.fixture
def mock_supabase():
    supabase = MagicMock()
    # Mock chain: table().select().eq().eq().not_.is_().order().limit().execute()
    mock_execute = MagicMock()
    supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.not_.is_.return_value.order.return_value.limit.return_value.execute = mock_execute
    return supabase, mock_execute

@pytest.mark.asyncio
async def test_update_resume_cache_truncates(mock_redis, mock_supabase):
    supabase, _ = mock_supabase
    manager = DocumentCacheManager(mock_redis, supabase)
    
    # Generate text > 1500 tokens. "word " is ~1 token. 2000 tokens worth.
    long_text = "word " * 2000 
    
    await manager.update_resume_cache("user1", long_text)
    
    # Assert set was called with truncated text
    mock_redis.set.assert_called_once()
    args, kwargs = mock_redis.set.call_args
    key, cached_text = args
    assert key == "resume:text:user1"
    
    # The cached text should be ~1500 tokens
    tokens = count_tokens(cached_text)
    assert tokens <= 1500
    assert kwargs.get("ex") == 7200

@pytest.mark.asyncio
async def test_update_docs_cache_empty(mock_redis, mock_supabase):
    supabase, mock_execute = mock_supabase
    manager = DocumentCacheManager(mock_redis, supabase)
    
    mock_execute.return_value = MagicMock(data=[])
    
    await manager.update_docs_cache("user1")
    
    # Assert delete was called
    mock_redis.delete.assert_called_once_with("docs:context:user1")

@pytest.mark.asyncio
async def test_update_docs_cache_multiple(mock_redis, mock_supabase):
    supabase, mock_execute = mock_supabase
    manager = DocumentCacheManager(mock_redis, supabase)
    
    mock_execute.return_value = MagicMock(data=[
        {"filename": "doc1.txt", "extracted_text": "Text 1 "*100, "created_at": "2024"},
        {"filename": "doc2.txt", "extracted_text": "Text 2 "*100, "created_at": "2024"},
        {"filename": "doc3.txt", "extracted_text": "Text 3 "*100, "created_at": "2024"},
    ])
    
    await manager.update_docs_cache("user1")
    
    mock_redis.set.assert_called_once()
    args, _ = mock_redis.set.call_args
    key, cached_text = args
    assert key == "docs:context:user1"
    assert "doc1.txt" in cached_text
    assert "doc2.txt" in cached_text
    assert "doc3.txt" in cached_text
    assert count_tokens(cached_text) <= 1000
