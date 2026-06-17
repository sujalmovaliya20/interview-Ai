from app.answer.models import SessionContext
from app.config import settings
from app.answer.token_utils import count_tokens
from typing import Any

class ContextBuilder:
    def __init__(self, cache_manager: Any):
        self.cache_manager = cache_manager
        self.redis = cache_manager.redis

    async def build_system_prompt(self, user_id: str, ctx: SessionContext) -> str:
        prompt = (
            "You are an expert AI interviewer assistant helping the interviewer answer candidate questions.\n\n"
            "CONTEXT UTILIZATION INSTRUCTIONS:\n"
            "- You will be provided with the CANDIDATE RESUME and ADDITIONAL COMPANY/ROLE CONTEXT sections below (if available).\n"
            "- You MUST actively use the candidate's resume to tailor your answers to their specific experience level, background, and stated tech stack (e.g., if the candidate has React/Node.js experience, frame coding concepts or examples using React/Node.js where applicable).\n"
            "- Use the company/role context to align your answers with the company's domain, tech preference, and requirements.\n"
            "- If a question is generic, personalize the explanation to fit the candidate's profile and the role context.\n\n"
            "RESPONSE FORMAT GUIDELINES:\n"
            "- Output must be concise, highly structured, and readable at a single glance during a live interview.\n"
            "- Use bold text to emphasize key terms and concepts.\n"
            "- Organize information using short, clear bullet points or numbered lists instead of long paragraphs.\n"
            "- Keep descriptions extremely direct and to the point. Avoid conversational filler or introductory fluff.\n"
        )
        
        # 1. Fetch AI context documents (from Redis, or rebuild on-demand from Supabase if expired)
        resume_text = await self.cache_manager.get_or_build_resume_context(user_id)
        docs_text = await self.cache_manager.get_or_build_docs_context(user_id)
        
        if resume_text:
            prompt += f"\n--- CANDIDATE RESUME ---\n{resume_text}\n------------------------\n"
            
        if docs_text:
            prompt += f"\n--- ADDITIONAL COMPANY/ROLE CONTEXT ---\n{docs_text}\n---------------------------------------\n"

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
            
        prompt += "\nProvide a concise, highly structured, and to-the-point answer following the RESPONSE FORMAT GUIDELINES.for the user's latest question"
        return prompt
