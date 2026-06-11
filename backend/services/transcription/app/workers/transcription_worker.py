import asyncio
import redis.asyncio as redis
import base64
import json
import time
import numpy as np
from ..logger import get_logger
from ..audio.preprocessor import AudioPreprocessor
from ..audio.exceptions import AudioTooShortError, AudioSilenceError, AudioPreprocessingError
from ..transcription.engine import TranscriptionEngine
from ..transcription.models import TranscriptionResult
from ..answer.engine import AnswerEngine

class TranscriptionWorker:
    """
    Pulls audio chunks from Redis queue, transcribes, publishes results,
    and forwards text to the Answer Engine.
    """
    
    def __init__(self, worker_id: int, redis_client: redis.Redis, engine: TranscriptionEngine, answer_engine: AnswerEngine):
        self.worker_id = worker_id
        self.redis = redis_client
        self.engine = engine
        self.answer_engine = answer_engine
        self.logger = get_logger("worker")
        
    async def run(self):
        """Infinite loop — pull from Redis, process, publish"""
        self.logger.info("worker_started", worker_id=self.worker_id)
        while True:
            try:
                await self._process_one()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("worker_error", worker_id=self.worker_id, error=str(e))
                await asyncio.sleep(0.5)  # brief backoff on unexpected error

    async def _process_one(self):
        """
        BRPOP blocks until a chunk arrives (timeout 1s to allow cancellation).
        Queue key pattern: audio:queue:{sessionId}
        Uses a routing key: audio:routing (list of sessionIds with pending chunks)
        """
        # BRPOP from routing queue — gets sessionId
        result = await self.redis.brpop("audio:routing", timeout=1)
        if not result:
            return
        
        _, session_id_b = result
        session_id = session_id_b.decode()
        
        # RPOP the actual chunk from session queue
        chunk_bytes = await self.redis.rpop(f"audio:queue:{session_id}")
        if not chunk_bytes:
            return
        
        raw_bytes = chunk_bytes
        
        # Get session language from Redis
        language_b = await self.redis.get(f"session:language:{session_id}")
        language = language_b.decode() if language_b else None
        
        # Get user ID from Redis (needed for Answer Engine context)
        user_id_b = await self.redis.get(f"session:user_id:{session_id}")
        user_id = user_id_b.decode() if user_id_b else "unknown_user"

        import numpy as np
        audio_array = np.frombuffer(raw_bytes, dtype=np.float32)
        if len(audio_array) == 0:
            return
            
        is_silent = AudioPreprocessor.detect_silence(audio_array)
        buffer_key = f"audio:buffer:{session_id}"
        
        if not is_silent:
            await self.redis.rpush(buffer_key, raw_bytes)
            # Max 15 seconds (60 chunks of 250ms) before forcing flush
            length = await self.redis.llen(buffer_key)
            if length < 60:
                return
        else:
            length = await self.redis.llen(buffer_key)
            if length == 0:
                return
            # Add trailing silence
            await self.redis.rpush(buffer_key, raw_bytes)
            
        # Flush buffer safely using a pipeline
        pipeline = self.redis.pipeline()
        pipeline.lrange(buffer_key, 0, -1)
        pipeline.delete(buffer_key)
        results = await pipeline.execute()
        
        buffered_chunks = results[0]
        if not buffered_chunks:
            return
            
        combined_bytes = b"".join(buffered_chunks)

        # Preprocess
        try:
            wav_bytes = await AudioPreprocessor.preprocess(combined_bytes)
        except (AudioTooShortError, AudioSilenceError):
            return  # skip silent/short chunks silently
        except AudioPreprocessingError as e:
            self.logger.warning("preprocessing_failed", session_id=session_id, error=str(e))
            return
        
        # Transcribe
        try:
            result = await self.engine.transcribe(wav_bytes, language, session_id)
        except Exception as e:
            self.logger.error("transcription_failed", session_id=session_id, error=str(e))
            await self._publish_error(session_id, str(e))
            return
        
        # Skip empty results
        if not result.text.strip():
            return
        
        # Publish to Redis pub/sub
        await self._publish_result(session_id, result)

        # Trigger Answer Engine asynchronously
        # Using default model 'nvidia' for Answer Engine since it manages primary/fallback
        await self.answer_engine.process_transcript(
            text=result.text,
            session_id=session_id,
            user_id=user_id,
            model="nvidia",
            language=language or "en"
        )

    async def _publish_result(self, session_id: str, result: TranscriptionResult):
        payload = {
            "type": "transcript_delta",
            "sessionId": session_id,
            "text": result.text,
            "language": result.language_detected,
            "provider": result.provider,
            "isFinal": True,
            "timestamp": int(time.time() * 1000),
            "latency_ms": result.latency_ms
        }
        await self.redis.publish(
            f"transcripts:{session_id}",
            json.dumps(payload)
        )

    async def _publish_error(self, session_id: str, error: str):
        payload = { "type": "transcription_error", "sessionId": session_id, "error": error }
        await self.redis.publish(f"transcripts:{session_id}", json.dumps(payload))
