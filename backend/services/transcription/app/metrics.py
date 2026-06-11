from typing import Dict
import time

class Metrics:
    def __init__(self):
        self.transcription_count: Dict[str, int] = {'whisper': 0, 'deepgram': 0}
        self.error_count: int = 0
        self.total_latency_ms: float = 0.0
        self.chunk_count: int = 0

    def record_transcription(self, provider: str, latency_ms: float):
        self.transcription_count[provider] = self.transcription_count.get(provider, 0) + 1
        self.total_latency_ms += latency_ms
        self.chunk_count += 1

    def record_error(self):
        self.error_count += 1

    def get_summary(self) -> dict:
        avg_latency = self.total_latency_ms / self.chunk_count if self.chunk_count > 0 else 0
        return {
            "whisper_count": self.transcription_count.get('whisper', 0),
            "deepgram_count": self.transcription_count.get('deepgram', 0),
            "error_count": self.error_count,
            "avg_latency_ms": avg_latency,
            "chunk_count": self.chunk_count
        }

metrics = Metrics()
