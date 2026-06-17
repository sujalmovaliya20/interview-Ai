import sys
import os
import asyncio
from dotenv import load_dotenv

# Load transcription .env before importing config
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription", ".env"))
load_dotenv(env_path)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "transcription")))

from app.config import settings
from supabase import create_client

print("Supabase URL:", settings.supabase_url)
print("Supabase Key:", settings.supabase_service_role_key[:15] + "...")

client = create_client(settings.supabase_url, settings.supabase_service_role_key)

async def main():
    try:
        # Find a real user_id from the documents table first
        print("Finding a real user_id with documents...")
        res_users = client.table('documents').select('user_id').limit(1).execute()
        users_data = res_users.data if hasattr(res_users, 'data') else res_users.get('data', [])
        if not users_data:
            print("No documents found in the database. Cannot run test.")
            return
        
        user_id = users_data[0]['user_id']
        print(f"Found user_id: {user_id}")

        # Run the resume context query
        print(f"Running resume query for user {user_id}...")
        res = client.table('documents')\
            .select('extracted_text')\
            .eq('user_id', user_id)\
            .eq('is_resume', True)\
            .not_.is_('extracted_text', 'null')\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        print("Resume Query Result:", res.data if hasattr(res, 'data') else res.get('data', []))
    except Exception as e:
        print("Resume Query Error:", str(e))

    try:
        # Run the docs context query
        print(f"Running docs query for user {user_id}...")
        res = client.table('documents')\
            .select('filename, extracted_text, created_at')\
            .eq('user_id', user_id)\
            .eq('is_resume', False)\
            .not_.is_('extracted_text', 'null')\
            .order('created_at', desc=True)\
            .limit(5)\
            .execute()
        print("Docs Query Result:", res.data if hasattr(res, 'data') else res.get('data', []))
    except Exception as e:
        print("Docs Query Error:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
