import logging
import structlog
import sys
from .config import settings

def setup_logging():
    log_level = logging.getLevelName(settings.log_level.upper())
    
    # Check if we are in development mode based on log level or generic setup
    is_development = settings.log_level.upper() == "DEBUG"
    
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(colors=True) if is_development else structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

def get_logger(name: str):
    return structlog.get_logger(name).bind(service="transcription", version="1.0.0")
