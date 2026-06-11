import numpy as np
import librosa
import soundfile as sf
import io
from .exceptions import AudioTooShortError, AudioSilenceError, AudioPreprocessingError

class AudioPreprocessor:

    @staticmethod
    async def preprocess(raw_bytes: bytes, source_format: str = "float32") -> bytes:
        """
        Convert raw audio bytes to 16kHz mono WAV for Whisper.
        Input: Float32Array bytes from browser (from useAudioCapture hook)
        Output: WAV file bytes ready for Whisper API
        """
        try:
            # 1. np.frombuffer(raw_bytes, dtype=np.float32)
            audio_array = np.frombuffer(raw_bytes, dtype=np.float32)
            
            # If empty array
            if len(audio_array) == 0:
                raise AudioTooShortError("Audio array is empty")

            # 2. If stereo (2D array): librosa.to_mono()
            # Raw bytes from Float32Array are typically flattened. 
            # We assume it is mono since useAudioCapture captures mono.

            # 3. Detect orig_sr from chunk duration (250ms chunks -> 4000 samples at 16kHz)
            # Actually, standard browser sample rate is often 44100 or 48000 unless we enforced 16000.
            # In useAudioCapture, we requested 16kHz. 4000 samples / 0.25s = 16000.
            detected_sr = 16000
            
            # 4. Normalize and apply noise gate
            # clip to [-1.0, 1.0]
            audio_array = np.clip(audio_array, -1.0, 1.0)
            
            if AudioPreprocessor.detect_silence(audio_array):
                raise AudioSilenceError("Audio is effectively silent")
                
            # 5. Convert to WAV
            buffer = io.BytesIO()
            sf.write(buffer, audio_array, detected_sr, format='WAV', subtype='PCM_16')
            wav_bytes = buffer.getvalue()
            
            # 6. Validate output duration
            duration = len(audio_array) / detected_sr
            if duration < 0.1:
                raise AudioTooShortError(f"Audio duration {duration}s is too short")
                
            return wav_bytes
            
        except (AudioTooShortError, AudioSilenceError):
            raise
        except Exception as e:
            raise AudioPreprocessingError(f"Failed to preprocess audio: {str(e)}")

    @staticmethod  
    def detect_silence(audio_array: np.ndarray, threshold: float = 0.01) -> bool:
        """Returns True if chunk is effectively silent — skip transcription"""
        rms = np.sqrt(np.mean(audio_array**2))
        return rms < threshold
