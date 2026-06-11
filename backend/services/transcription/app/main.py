from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import redis.asyncio as redis
import asyncio
from datetime import datetime

from .config import settings
from .logger import setup_logging, get_logger
from .transcription.engine import TranscriptionEngine
from .workers.transcription_worker import TranscriptionWorker
from .audio.preprocessor import AudioPreprocessor
from .metrics import metrics
from .answer.engine import AnswerEngine
from .webhooks.document_webhook import document_webhook_router
from .docs.processor import DocumentProcessor
import supabase

setup_logging()
logger = get_logger("main")

class AppState:
    redis: redis.Redis
    engine: TranscriptionEngine
    answer_engine: AnswerEngine
    worker_tasks: list[asyncio.Task]
    doc_processor: DocumentProcessor
    supabase_client: supabase.Client

state = AppState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("app_starting", worker_count=settings.worker_count)
    state.redis = redis.from_url(settings.redis_url)
    state.engine = TranscriptionEngine()
    state.supabase_client = supabase.create_client(settings.supabase_url, settings.supabase_service_role_key)
    state.answer_engine = AnswerEngine(state.redis, state.supabase_client)
    state.doc_processor = DocumentProcessor(state.redis, state.supabase_client)
    
    # Store doc_processor directly on app.state so the webhook router can access it
    app.state.doc_processor = state.doc_processor

    state.worker_tasks = []
    for i in range(settings.worker_count):
        worker = TranscriptionWorker(i, state.redis, state.engine, state.answer_engine)
        task = asyncio.create_task(worker.run())
        state.worker_tasks.append(task)
        
    yield
    
    # Shutdown
    logger.info("app_shutting_down")
    for task in state.worker_tasks:
        task.cancel()
    
    await asyncio.gather(*state.worker_tasks, return_exceptions=True)
    await state.redis.close()

app = FastAPI(lifespan=lifespan)
app.include_router(document_webhook_router)

@app.middleware("http")
async def structlog_middleware(request: Request, call_next):
    import time
    start_time = time.monotonic()
    
    response = await call_next(request)
    
    process_time_ms = (time.monotonic() - start_time) * 1000
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=process_time_ms
    )
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )

def verify_internal_key(request: Request):
    key = request.headers.get("X-Internal-Key")
    if not settings.internal_api_key or key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "workers": settings.worker_count,
        "circuit_breaker": state.engine.circuit_breaker.state if hasattr(state, 'engine') else "unknown",
        "redis": "connected" if hasattr(state, 'redis') else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/metrics")
async def get_metrics(verified = Depends(verify_internal_key)):
    summary = metrics.get_summary()
    summary["circuit_breaker_state"] = state.engine.circuit_breaker.state
    return summary

@app.post("/transcribe")
async def transcribe_direct(
    audio: UploadFile = File(...),
    language: str | None = Form(None),
    verified = Depends(verify_internal_key)
):
    try:
        raw_bytes = await audio.read()
        wav_bytes = await AudioPreprocessor.preprocess(raw_bytes)
        result = await state.engine.transcribe(wav_bytes, language, "direct_test")
        
        metrics.record_transcription(result.provider, result.latency_ms)
        return result.model_dump()
    except Exception as e:
        metrics.record_error()
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
import openai

class AnalyzeScreenRequest(BaseModel):
  image_base64: str
  session_id: str | None = None

@app.post("/analyze-screen")
async def analyze_screen(req: AnalyzeScreenRequest):
  """
  Analyze screenshot using NVIDIA vision model.
  Returns AI answer for coding question shown on screen.
  """
  try:
    # Build prompt with image context
    # NVIDIA supports image input via base64 in messages
    client = openai.AsyncOpenAI(
      api_key=settings.nvidia_api_key,
      base_url=settings.nvidia_base_url
    )

    # Try vision model first
    vision_model = "microsoft/phi-3.5-vision-instruct"  # free on NVIDIA NIM

    response = await client.chat.completions.create(
      model=vision_model,
      messages=[
        {
          "role": "user",
          "content": [
            {
              "type": "image_url",
              "image_url": {
                "url": f"data:image/jpeg;base64,{req.image_base64}"
              }
            },
            {
              "type": "text",
              "text": "This is a screenshot from a technical interview. Identify the question being asked and provide a complete, well-structured answer. If it's a coding question, provide working code with explanation."
            }
          ]
        }
      ],
      max_tokens=1024,
      temperature=0.7
    )

    answer = response.choices[0].message.content
    return { "answer": answer, "model": vision_model }

  except Exception as e:
    # Fallback: just use text model with generic prompt
    try:
      client = openai.AsyncOpenAI(
        api_key=settings.nvidia_api_key,
        base_url=settings.nvidia_base_url
      )
      response = await client.chat.completions.create(
        model=settings.nvidia_primary_model,
        messages=[
          {"role": "system", "content": "You are an expert interview coach."},
          {"role": "user", "content": "Analyze the interview screen and provide a helpful answer for the technical question shown."}
        ],
        max_tokens=800
      )
      return { "answer": response.choices[0].message.content, "model": "fallback" }
    except Exception as e2:
      raise HTTPException(status_code=500, detail=str(e2))

