import pytest
import numpy as np
from app.audio.preprocessor import AudioPreprocessor
from app.audio.exceptions import AudioTooShortError, AudioSilenceError

@pytest.mark.asyncio
async def test_silence_detection():
    # Create silent audio
    silent_audio = np.zeros(4000, dtype=np.float32)
    assert AudioPreprocessor.detect_silence(silent_audio) == True
    
    # Create loud audio
    loud_audio = np.ones(4000, dtype=np.float32) * 0.5
    assert AudioPreprocessor.detect_silence(loud_audio) == False

@pytest.mark.asyncio
async def test_preprocess_float32():
    # 4000 samples of noise
    audio = np.random.uniform(-0.5, 0.5, 4000).astype(np.float32)
    raw_bytes = audio.tobytes()
    
    wav_bytes = await AudioPreprocessor.preprocess(raw_bytes)
    assert wav_bytes.startswith(b'RIFF')
    assert b'WAVE' in wav_bytes

@pytest.mark.asyncio
async def test_too_short_raises():
    # Very short audio (e.g. 100 samples)
    audio = np.ones(100, dtype=np.float32) * 0.5
    raw_bytes = audio.tobytes()
    
    with pytest.raises(AudioTooShortError):
        await AudioPreprocessor.preprocess(raw_bytes)

@pytest.mark.asyncio
async def test_all_silence_raises():
    silent_audio = np.zeros(4000, dtype=np.float32)
    raw_bytes = silent_audio.tobytes()
    
    with pytest.raises(AudioSilenceError):
        await AudioPreprocessor.preprocess(raw_bytes)
