from pydantic import BaseModel
from typing import List

class QAPair(BaseModel):
    question: str
    answer: str

class SessionContext(BaseModel):
    session_id: str
    user_id: str
    model: str
    language: str | None
    extra_context: str | None
    role_hint: str | None
    history: List[QAPair]
