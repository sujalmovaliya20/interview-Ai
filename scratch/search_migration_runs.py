import json

log_path = r"C:\Users\Brijesh Movaliya\.gemini\antigravity-ide\brain\0545df0c-f5a9-4fcc-b15e-dbf4eac3b2d5\.system_generated\logs\transcript.jsonl"

print(f"Reading {log_path}...")
with open(log_path, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f):
        try:
            data = json.loads(line)
            content = data.get("content", "")
            tool_calls = data.get("tool_calls", [])
            
            if "apply_migration" in str(data) or "006" in str(data):
                step_idx = data.get("step_index")
                source = data.get("source")
                type_ = data.get("type")
                print(f"--- Line {line_num} | Step {step_idx} | Source: {source} | Type: {type_} ---")
                if content:
                    print("Content:", content[:500])
                if tool_calls:
                    print("Tool Calls:", tool_calls)
        except Exception:
            pass
