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

sql_file = 'supabase/migrations/005_agent_tables.sql'
print(f"Reading SQL file: {sql_file}")
with open(sql_file, 'r', encoding='utf-8') as f:
    sql_query = f.read()

print("Executing SQL migration via exec_sql RPC...")
try:
    response = supabase.rpc('exec_sql', {'sql_query': sql_query}).execute()
    print("Response received:")
    print("Data:", response.data)
    # Check for error in response representation
    if hasattr(response, 'error') and response.error:
        print("Error from response object:", response.error)
    print("Migration execution completed.")
except Exception as e:
    print("Exception occurred during SQL execution:", e)
