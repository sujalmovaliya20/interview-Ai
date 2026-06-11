import re
from app.config import settings

class QuestionDetector:
    def is_question(self, text: str) -> bool:
        t = text.strip()
        words = t.split()
        if len(words) < settings.question_detection_min_words:
            return False
            
        t_lower = t.lower()
        if t_lower.endswith("?"):
            return True
            
        question_starters = ["how", "what", "why", "where", "when", "who", "can", "could", "tell", "describe", "explain", "is", "are", "do", "does"]
        if any(t_lower.startswith(w + " ") for w in question_starters):
            return True
            
        return False

    def extract_question(self, text: str) -> str:
        return text.strip()
