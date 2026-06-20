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

random_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
print(f"Attempting to create user with email: {random_email}")

try:
    # Use supabase.auth.admin.create_user to create a user admin-style
    response = supabase.auth.admin.create_user({
        "email": random_email,
        "password": "SuperSecretPassword123!",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Test User",
            "name": "Test User",
            "avatar_url": "https://example.com/avatar.png"
        },
        "app_metadata": {
            "provider": "google"
        }
    })
    print("User created successfully!")
    print(response)
except Exception as e:
    print("Exception occurred during user creation:")
    print(e)
