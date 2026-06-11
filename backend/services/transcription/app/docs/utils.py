import tiktoken

def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """Count tokens using tiktoken (default cl100k_base for GPT/Llama approximations)."""
    if not text:
        return 0
    try:
        encoding = tiktoken.get_encoding(model)
        return len(encoding.encode(text))
    except Exception:
        # Fallback approximation: 1 token ~= 4 chars
        return len(text) // 4

def truncate_to_tokens(text: str, max_tokens: int, model: str = "cl100k_base") -> str:
    """Truncate text to a maximum number of tokens."""
    if not text:
        return ""
    try:
        encoding = tiktoken.get_encoding(model)
        tokens = encoding.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return encoding.decode(tokens[:max_tokens])
    except Exception:
        # Fallback approximation
        max_chars = max_tokens * 4
        if len(text) <= max_chars:
            return text
        return text[:max_chars]
