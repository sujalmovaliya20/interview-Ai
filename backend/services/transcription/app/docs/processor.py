import redis.asyncio as aioredis
from typing import Any
from datetime import datetime
from ..logger import get_logger
from .extractor import DocumentExtractor
from .cache_manager import DocumentCacheManager
from .exceptions import EmptyDocumentError, UnsupportedMimeTypeError
from .utils import count_tokens, truncate_to_tokens

class DocumentProcessor:
    """
    Main document processing orchestrator.
    Called by webhook handler when new document inserted.
    """
    def __init__(self, redis: aioredis.Redis, supabase_client: Any):
        self.extractor = DocumentExtractor()
        self.supabase = supabase_client
        self.cache_manager = DocumentCacheManager(redis, supabase_client)
        self.logger = get_logger("doc_processor")

    async def process_document(self, document_id: str, user_id: str) -> None:
        self.logger.info("processing_document", document_id=document_id, user_id=user_id)
        
        try:
            # 1. Fetch document record (assuming sync client, so no await for .execute() unless async client)
            # Actually we'll just try to use it as sync if await fails or we'll wrap it.
            # Supabase Python client v2 is sync. We will run it in executor to avoid blocking.
            import asyncio
            loop = asyncio.get_event_loop()

            def _fetch_doc():
                res = self.supabase.table('documents')\
                    .select('*')\
                    .eq('id', document_id)\
                    .single()\
                    .execute()
                return res.data if hasattr(res, 'data') else res.get('data')

            doc = await loop.run_in_executor(None, _fetch_doc)
            if not doc:
                raise ValueError(f"Document {document_id} not found")

            # 2. Download file from Supabase Storage
            def _download_file():
                return self.supabase.storage\
                    .from_('documents')\
                    .download(doc['storage_path'])
            
            file_bytes = await loop.run_in_executor(None, _download_file)

            # 3. Extract text
            extracted_text = await self.extractor.extract(
                file_bytes,
                doc['mime_type'],
                doc['filename']
            )

            # 4. Count tokens
            token_count = count_tokens(extracted_text)

            # 5. Truncate if needed (max 8000 tokens stored in DB)
            stored_text = truncate_to_tokens(extracted_text, 8000)

            # 6. Update document record: extracted_text + token_count + processed_at
            def _update_doc():
                self.supabase.table('documents').update({
                    'extracted_text': stored_text,
                    'token_count': token_count,
                    'processed_at': datetime.utcnow().isoformat(),
                    'processing_error': None
                }).eq('id', document_id).execute()

            await loop.run_in_executor(None, _update_doc)

            # 7. Update Redis cache
            if doc['is_resume']:
                await self.cache_manager.update_resume_cache(user_id, stored_text)
            else:
                await self.cache_manager.update_docs_cache(user_id)

            self.logger.info("document_processed_ok",
                document_id=document_id, token_count=token_count,
                is_resume=doc['is_resume'])

        except (EmptyDocumentError, UnsupportedMimeTypeError) as e:
            # User error — store error message, don't retry
            await self._mark_error(document_id, str(e))
            self.logger.warning("document_user_error", document_id=document_id, error=str(e))

        except Exception as e:
            # System error — store error, log fully
            await self._mark_error(document_id, f"Processing failed: {str(e)}")
            self.logger.error("document_processing_failed",
                document_id=document_id, error=str(e), exc_info=True)

    async def _mark_error(self, document_id: str, error: str):
        import asyncio
        loop = asyncio.get_event_loop()
        def _update_err():
            self.supabase.table('documents').update({
                'processing_error': error,
                'processed_at': datetime.utcnow().isoformat()
            }).eq('id', document_id).execute()
        await loop.run_in_executor(None, _update_err)
