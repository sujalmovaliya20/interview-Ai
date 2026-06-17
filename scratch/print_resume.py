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
        user_id = "b4ffdc99-9413-4ed3-9e67-81c29b8a0397"
        res = supabase.table('documents')\
            .select('extracted_text')\
            .eq('user_id', user_id)\
            .eq('is_resume', True)\
            .not_.is_('extracted_text', 'null')\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        data = res.data if hasattr(res, 'data') else res.get('data', [])
        
        if data:
            print("Extracted Text Length:", len(data[0]['extracted_text']))
            print("\n--- EXTRACTED TEXT ---")
            print(data[0]['extracted_text'][:1000])
            print("----------------------")
        else:
            print("No resume found for user Sujal.")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
