from fastapi import APIRouter, Header, HTTPException, Request, BackgroundTasks
from ..config import settings
from ..logger import get_logger

logger = get_logger("document_webhook")
document_webhook_router = APIRouter(prefix="/webhooks")

@document_webhook_router.post("/document-created")
async def document_created(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_secret: str = Header(None)
):
    if not settings.webhook_secret or x_webhook_secret != settings.webhook_secret:
        logger.warning("webhook_auth_failed", provided_secret=x_webhook_secret)
        raise HTTPException(status_code=401, detail="Unauthorized webhook call")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    if body.get("type") != "INSERT":
        return {"received": True, "ignored": "Not an INSERT event"}

    record = body.get("record", {})
    document_id = record.get("id")
    user_id = record.get("user_id")

    if not document_id or not user_id:
        raise HTTPException(status_code=400, detail="Missing document_id or user_id in record")

    # Import and get the processor from the app state
    # We will access it via request.app.state.doc_processor
    processor = getattr(request.app.state, "doc_processor", None)
    if not processor:
        logger.error("doc_processor_not_initialized")
        raise HTTPException(status_code=500, detail="Processor not initialized")

    # Fire and forget
    background_tasks.add_task(processor.process_document, document_id, user_id)
    
    logger.info("webhook_received", document_id=document_id, user_id=user_id)
    return {"received": True}
