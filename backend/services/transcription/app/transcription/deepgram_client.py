import time
from deepgram import DeepgramClient as DgClient, PrerecordedOptions
from .exceptions import DeepgramError
from .models import TranscriptionResult, WordTimestamp

class DeepgramClient:
    def __init__(self, api_key: str):
        # Initialize the Deepgram Client
        self.client = DgClient(api_key)

    async def transcribe(self, audio_bytes: bytes, language: str | None = None) -> TranscriptionResult:
        """
        Deepgram Nova-2 model — faster latency, fallback for Whisper failures.
        """
        try:
            start = time.monotonic()
            
            options = PrerecordedOptions(
                model="nova-2",
                language=language or "en",
                punctuate=True,
                utterances=False,
                smart_format=True
            )
            
            payload = {
                "buffer": audio_bytes,
                "mimetype": "audio/wav"
            }
            
            # Note: Deepgram AsyncClient in v3 SDK
            response = await self.client.listen.asyncprerecorded.v("1").transcribe_file(
                payload,
                options
            )
            
            response_dict = response.to_dict()
            
            latency = (time.monotonic() - start) * 1000
            
            # Extract
            results = response_dict.get('results', {})
            channels = results.get('channels', [])
            
            if not channels:
                raise DeepgramError("No channels in response")
                
            alternatives = channels[0].get('alternatives', [])
            if not alternatives:
                raise DeepgramError("No alternatives in response")
                
            alt = alternatives[0]
            text = alt.get('transcript', '')
            raw_words = alt.get('words', [])
            
            words = [
                WordTimestamp(word=w.get('word', ''), start=w.get('start', 0.0), end=w.get('end', 0.0))
                for w in raw_words
            ]
            
            # duration is usually in metadata
            duration = response_dict.get('metadata', {}).get('duration', 0.0)

            return TranscriptionResult(
                text=text,
                language_detected=language or "en",
                duration=duration,
                words=words,
                provider='deepgram',
                latency_ms=latency
            )

        except Exception as e:
            raise DeepgramError(f"Deepgram transcription failed: {str(e)}")
