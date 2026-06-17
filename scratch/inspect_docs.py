import sys
import os
import asyncio
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription", ".env"))
load_dotenv(env_path)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription")))

from app.lib.supabase import supabase

async def main():
    try:
        # Fetch documents
        res = supabase.table('documents').select('id, user_id, filename, is_resume, mime_type, extracted_text, processing_error').execute()
        data = res.data if hasattr(res, 'data') else res.get('data', [])
        
        print(f"Total documents in database: {len(data)}")
        for idx, doc in enumerate(data):
            text_len = len(doc.get('extracted_text') or '')
            has_text = "YES" if text_len > 0 else "NO"
            print(f"[{idx}] ID: {doc['id']} | User: {doc['user_id']} | File: {doc['filename']} | IsResume: {doc['is_resume']} | HasText: {has_text} (len: {text_len}) | Error: {doc.get('processing_error')}")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
