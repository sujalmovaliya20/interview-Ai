from app.answer.models import SessionContext
import redis.asyncio as redis
from app.config import settings
from app.answer.token_utils import count_tokens

class ContextBuilder:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def build_system_prompt(self, user_id: str, ctx: SessionContext) -> str:
        prompt = "You are an expert AI interviewer assistant helping the interviewer answer candidate questions.\n"
        
        # 1. Fetch AI context documents from Redis
        resume_text = await self.redis.get(f"resume:text:{user_id}")
        docs_text = await self.redis.get(f"docs:context:{user_id}")
        
        if resume_text:
            prompt += f"\n--- CANDIDATE RESUME ---\n{resume_text.decode()}\n------------------------\n"
            
        if docs_text:
            prompt += f"\n--- ADDITIONAL COMPANY/ROLE CONTEXT ---\n{docs_text.decode()}\n---------------------------------------\n"

        if ctx.role_hint:
            prompt += f"\nRole context: {ctx.role_hint}\n"
            
        if ctx.extra_context:
            prompt += f"Additional Context: {ctx.extra_context}\n"
            
        if ctx.history:
            prompt += "Conversation History:\n"
            # Keep history under context token limits
            history_str = ""
            for pair in reversed(ctx.history):
                entry = f"User: {pair.question}\nAI: {pair.answer}\n"
                if count_tokens(prompt + history_str + entry) > settings.answer_context_max_tokens:
                    break
                history_str = entry + history_str
            prompt += history_str
            
        prompt += "\nProvide a concise and helpful answer to the user's latest question."
        return prompt
