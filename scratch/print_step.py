import json

log_path = r"C:\Users\Brijesh Movaliya\.gemini\antigravity-ide\brain\0545df0c-f5a9-4fcc-b15e-dbf4eac3b2d5\.system_generated\logs\transcript.jsonl"

target_steps = [747, 748, 749, 750, 751, 752]

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            if step_idx in target_steps:
                print(f"=== STEP {step_idx} ===")
                print(data.get("content"))
                print("Tool Calls:", data.get("tool_calls"))
        except Exception:
            pass
