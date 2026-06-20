import json
import os

log_path = r"C:\Users\Brijesh Movaliya\.gemini\antigravity-ide\brain\0545df0c-f5a9-4fcc-b15e-dbf4eac3b2d5\.system_generated\logs\transcript.jsonl"

queries = ["migration", "apply", "trigger", "sql", "error", "auth", "profile"]
print(f"Reading {log_path}...")

with open(log_path, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f):
        try:
            data = json.loads(line)
            content = data.get("content", "")
            tool_calls = data.get("tool_calls", [])
            
            # check if tool calls run commands or write files
            tool_str = str(tool_calls)
            
            matched = []
            for q in queries:
                if q in content.lower() or q in tool_str.lower():
                    matched.append(q)
            
            if matched:
                # Print some snippet
                step_idx = data.get("step_index")
                source = data.get("source")
                type_ = data.get("type")
                print(f"Line {line_num} | Step {step_idx} | Source: {source} | Type: {type_} | Matched: {matched}")
                if content:
                    print("  Content snippet:", content[:200].replace('\n', ' '))
                if tool_calls:
                    print("  Tool calls:", str(tool_calls)[:200])
        except Exception as e:
            pass
