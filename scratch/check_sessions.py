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
        # Check latest coach sessions
        print("--- LATEST COACH SESSIONS ---")
        res_coach = supabase.table('coach_sessions').select('id, user_id, role, status, started_at').order('started_at', desc=True).limit(5).execute()
        coach_sessions = res_coach.data if hasattr(res_coach, 'data') else res_coach.get('data', [])
        for idx, s in enumerate(coach_sessions):
            print(f"[{idx}] SessionID: {s['id']} | UserID: {s['user_id']} | Role: {s['role']} | Status: {s['status']} | StartedAt: {s['started_at']}")

        # Check latest real-time sessions
        print("\n--- LATEST REAL-TIME SESSIONS ---")
        res_sessions = supabase.table('sessions').select('id, user_id, status, created_at').order('created_at', desc=True).limit(5).execute()
        sessions = res_sessions.data if hasattr(res_sessions, 'data') else res_sessions.get('data', [])
        for idx, s in enumerate(sessions):
            print(f"[{idx}] SessionID: {s['id']} | UserID: {s['user_id']} | Status: {s['status']} | CreatedAt: {s['created_at']}")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
