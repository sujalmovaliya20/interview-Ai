import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv(dotenv_path='.env.local')

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
    sys.exit(1)

print(f"Connecting to Supabase at: {url}")
supabase = create_client(url, key)

print("\n--- Querying auth.users columns via RPC exec_sql (Wait, we know exec_sql is not there, so let's use another method) ---")
# Wait, can we select from information_schema.columns directly via postgrest if we have service_role?
# No, Postgrest does not expose information_schema by default.
# But we can try to query auth.users directly. Wait! Let's see if we can query auth.users table using Postgrest:
try:
    # Supabase service role has access to auth schema sometimes, let's try:
    res = supabase.schema("auth").table("users").select("*").limit(1).execute()
    print("Direct query of auth.users succeeded!")
    if res.data:
        print("Columns present in data:", list(res.data[0].keys()))
except Exception as e:
    print("Direct query of auth.users failed:")
    print(e)
