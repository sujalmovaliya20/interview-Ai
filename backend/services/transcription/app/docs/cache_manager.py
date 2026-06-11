import redis.asyncio as aioredis
from typing import Any
from ..logger import get_logger
from .utils import count_tokens, truncate_to_tokens

class DocumentCacheManager:
    """
    Manages Redis cache for user document context.
    Called after document processing to update LLM context cache.
    """
    RESUME_KEY = "resume:text:{user_id}"
    DOCS_KEY = "docs:context:{user_id}"
    CACHE_TTL = 7200  # 2 hours

    def __init__(self, redis: aioredis.Redis, supabase_client: Any):
        self.redis = redis
        self.supabase_client = supabase_client
        self.logger = get_logger("doc_cache_manager")

    async def update_resume_cache(self, user_id: str, extracted_text: str) -> None:
        key = self.RESUME_KEY.format(user_id=user_id)
        # Truncate to 1500 tokens before caching
        truncated = truncate_to_tokens(extracted_text, 1500)
        await self.redis.set(key, truncated, ex=self.CACHE_TTL)
        self.logger.info("resume_cache_updated", user_id=user_id,
            original_tokens=count_tokens(extracted_text),
            cached_tokens=count_tokens(truncated))

    async def update_docs_cache(self, user_id: str) -> None:
        """
        Rebuild docs context cache from all non-resume documents.
        Called after any document add/delete.
        """
        key = self.DOCS_KEY.format(user_id=user_id)
        # Fetch all non-resume docs with extracted_text from Supabase
        result = self.supabase_client.table('documents')\
            .select('filename, extracted_text, created_at')\
            .eq('user_id', user_id)\
            .eq('is_resume', False)\
            .not_.is_('extracted_text', 'null')\
            .order('created_at', desc=True)\
            .limit(5)\
            .execute()

        # The python supabase client is synchronous for .execute() in v2.x usually, 
        # but let's handle the response.
        data = result.data if hasattr(result, 'data') else result.get('data', [])

        if not data:
            await self.redis.delete(key)
            return

        # Combine: filename header + text, budget 1000 tokens total
        parts = []
        total_tokens = 0
        for doc in data:
            header = f"[Document: {doc['filename']}]\n"
            text = doc['extracted_text'] or ''
            available = 1000 - total_tokens - count_tokens(header)
            if available <= 50:
                break
            truncated = truncate_to_tokens(text, available)
            parts.append(header + truncated)
            total_tokens += count_tokens(header + truncated)

        combined = '\n\n'.join(parts)
        await self.redis.set(key, combined, ex=self.CACHE_TTL)
        self.logger.info("docs_cache_updated", user_id=user_id, doc_count=len(parts))

    async def invalidate_user_cache(self, user_id: str) -> None:
        """Full cache clear — called on account delete"""
        await self.redis.delete(
            self.RESUME_KEY.format(user_id=user_id),
            self.DOCS_KEY.format(user_id=user_id)
        )

    async def get_or_build_resume_context(self, user_id: str) -> str:
        key = self.RESUME_KEY.format(user_id=user_id)
        cached = await self.redis.get(key)
        if cached is not None:
            return cached.decode()

        # If not cached, fetch from Supabase
        import asyncio
        loop = asyncio.get_event_loop()
        def _fetch():
            res = self.supabase_client.table('documents')\
                .select('extracted_text')\
                .eq('user_id', user_id)\
                .eq('is_resume', True)\
                .not_.is_('extracted_text', 'null')\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            return res.data if hasattr(res, 'data') else res.get('data', [])

        try:
            data = await loop.run_in_executor(None, _fetch)
            if data and data[0].get('extracted_text'):
                text = data[0]['extracted_text']
                # Update cache
                truncated = truncate_to_tokens(text, 1500)
                await self.redis.set(key, truncated, ex=self.CACHE_TTL)
                return truncated
        except Exception as e:
            self.logger.error("get_or_build_resume_context_failed", user_id=user_id, error=str(e))
        return ""

    async def get_or_build_docs_context(self, user_id: str) -> str:
        key = self.DOCS_KEY.format(user_id=user_id)
        cached = await self.redis.get(key)
        if cached is not None:
            return cached.decode()

        # Rebuild docs cache
        try:
            await self.update_docs_cache(user_id)
            cached2 = await self.redis.get(key)
            if cached2 is not None:
                return cached2.decode()
        except Exception as e:
            self.logger.error("get_or_build_docs_context_failed", user_id=user_id, error=str(e))
        return ""

