import os
import sys
import uuid
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

new_id = str(uuid.uuid4())
print(f"Using generated UUID: {new_id}")

# Attempt to insert into profiles
print("\n--- Testing insert into profiles ---")
try:
    res = supabase.table("profiles").insert({
        "id": new_id,
        "email": "test_insert@example.com",
        "full_name": "Test Insert",
        "avatar_url": None,
        "provider": "google"
    }).execute()
    print("Insert into profiles succeeded!")
    print(res.data)
except Exception as e:
    print("Insert into profiles failed:")
    print(e)

# Attempt to insert into credits
print("\n--- Testing insert into credits ---")
try:
    res = supabase.table("credits").insert({
        "user_id": new_id,
        "balance": 10.00,
        "is_unlimited": False
    }).execute()
    print("Insert into credits succeeded!")
    print(res.data)
except Exception as e:
    print("Insert into credits failed:")
    print(e)

# Clean up
print("\n--- Cleaning up test records ---")
try:
    supabase.table("credits").delete().eq("user_id", new_id).execute()
    supabase.table("profiles").delete().eq("id", new_id).execute()
    print("Clean up completed successfully!")
except Exception as e:
    print("Clean up failed:")
    print(e)
