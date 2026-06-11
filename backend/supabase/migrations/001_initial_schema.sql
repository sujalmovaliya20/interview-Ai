-- supabase/migrations/001_initial_schema.sql

-- Enable the pgcrypto extension for gen_random_uuid() if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. credits table
CREATE TABLE public.credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance decimal(10,2) DEFAULT 10.00 NOT NULL CHECK (balance >= 0),
  is_unlimited boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- 3. sessions table
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model text NOT NULL CHECK (model IN ('claude','gpt-5')),
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','error')),
  duration_seconds integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- 4. documents table
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  extracted_text text,
  token_count integer,
  is_resume boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT max_docs CHECK (true) -- enforced in app layer
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "User can SELECT own row only"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "User can UPDATE own row only"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policies for credits
CREATE POLICY "User can SELECT own row only"
ON public.credits FOR SELECT
USING (auth.uid() = user_id);
-- INSERT/UPDATE via service role only (no policy needed for service role)

-- Policies for sessions
CREATE POLICY "User can SELECT own rows only"
ON public.sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "User can INSERT own rows only"
ON public.sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can UPDATE own rows only"
ON public.sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for documents
CREATE POLICY "User can SELECT own rows only"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "User can INSERT own rows only"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can DELETE own rows only"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- TRIGGER: auto-create profile + credits row on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  INSERT INTO public.credits (user_id, balance)
  VALUES (new.id, 10.00);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
