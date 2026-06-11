from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Groq — free Whisper transcription
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_whisper_model: str = "whisper-large-v3"
    groq_timeout_seconds: float = 8.0

    # NVIDIA NIM — free LLM
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_primary_model: str = "abacusai/dracarys-llama-3.1-70b-instruct"
    nvidia_fallback_model: str = "mistralai/mistral-large"
    nvidia_timeout_seconds: float = 30.0

    # Deepgram — transcription fallback
    deepgram_api_key: str = ""

    # Answer engine
    answer_max_tokens: int = 1024
    answer_context_max_tokens: int = 4000
    question_detection_min_words: int = 4

    redis_url: str = "redis://localhost:6379"
    worker_count: int = 4
    circuit_breaker_threshold: int = 5
    circuit_breaker_reset_seconds: int = 300
    internal_api_key: str = ""
    log_level: str = "INFO"
    port: int = 8000

    # Supabase and Webhook settings
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    webhook_secret: str = "change-me"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
