try:
    import tiktoken
except ImportError:
    tiktoken = None

def count_tokens(text: str) -> int:
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception:
        # Fallback approximation: 1 token ~= 4 chars
        return len(text) // 4
