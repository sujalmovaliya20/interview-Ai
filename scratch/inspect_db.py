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

def run_sql(sql):
    try:
        response = supabase.rpc('exec_sql', {'sql_query': sql}).execute()
        return response.data
    except Exception as e:
        print("Exception:", e)
        return None

# 1. Inspect trigger function handle_new_user definition
print("\n--- handle_new_user Routine Definition ---")
res = run_sql("""
SELECT routine_definition, routine_schema
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
""")
print(res)

# 2. Inspect active triggers on auth.users
print("\n--- Triggers on auth.users ---")
res = run_sql("""
SELECT trigger_name, event_manipulation, action_statement, action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'users';
""")
print(res)

# 3. Inspect columns of public.profiles
print("\n--- public.profiles Columns ---")
res = run_sql("""
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public';
""")
print(res)

# 4. Inspect columns of public.credits
print("\n--- public.credits Columns ---")
res = run_sql("""
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'credits' AND table_schema = 'public';
""")
print(res)

# 5. Check if there are other triggers on public.profiles
print("\n--- Triggers on public.profiles ---")
res = run_sql("""
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
""")
print(res)
