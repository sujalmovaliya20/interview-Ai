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

print("\n--- Testing profiles query with all columns ---")
try:
    res = supabase.table("profiles").select("id, email, full_name, avatar_url, provider").limit(1).execute()
    print("Query with OAuth columns succeeded!")
    print(res.data)
except Exception as e:
    print("Query with OAuth columns failed:")
    print(e)

print("\n--- Testing profiles query with ONLY id and email ---")
try:
    res = supabase.table("profiles").select("id, email").limit(1).execute()
    print("Query with only id, email succeeded!")
    print(res.data)
except Exception as e:
    print("Query with only id, email failed:")
    print(e)

print("\n--- Testing credits query with all columns ---")
try:
    res = supabase.table("credits").select("id, user_id, balance, is_unlimited").limit(1).execute()
    print("Query with credits columns succeeded!")
    print(res.data)
except Exception as e:
    print("Query with credits columns failed:")
    print(e)

print("\n--- Testing credits query with ONLY id, user_id, balance ---")
try:
    res = supabase.table("credits").select("id, user_id, balance").limit(1).execute()
    print("Query with only id, user_id, balance succeeded!")
    print(res.data)
except Exception as e:
    print("Query with only id, user_id, balance failed:")
    print(e)
