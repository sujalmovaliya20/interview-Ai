from pydantic import BaseModel
from typing import Literal

class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float

class TranscriptionResult(BaseModel):
    text: str
    language_detected: str
    duration: float
    words: list[WordTimestamp]
    provider: Literal['groq', 'deepgram']
    latency_ms: float
