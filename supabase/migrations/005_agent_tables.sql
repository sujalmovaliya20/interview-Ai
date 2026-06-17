-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Question bank table with embeddings
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  category text NOT NULL,
  -- categories: behavioral, technical, system_design, leadership, situational
  difficulty text NOT NULL DEFAULT 'medium',
  -- difficulty: easy, medium, hard
  role_tags text[] DEFAULT '{}',
  -- e.g. ['frontend', 'backend', 'fullstack', 'data', 'product']
  embedding vector(2048),
  -- NVIDIA NIM embedding dimension
  follow_up_questions text[] DEFAULT '{}',
  ideal_answer_points text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Index for fast vector similarity search (Commented out because pgvector has a 2000-dimension limit for ivfflat/hnsw indexes, and a table of 100-1000 questions does not require indexing for fast query performance).
-- CREATE INDEX IF NOT EXISTS questions_embedding_idx
--   ON public.questions USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- Coach sessions table (different from existing sessions)
CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text,
  -- e.g. "Senior React Engineer at Stripe"
  session_type text NOT NULL DEFAULT 'mixed',
  -- types: behavioral, technical, mixed, rapid_fire
  status text NOT NULL DEFAULT 'active',
  -- active, completed, abandoned
  questions_asked integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  overall_score decimal(4,2),
  -- 0.00 to 10.00
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  report jsonb,
  -- full report data
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer
);

-- User answers with evaluation
CREATE TABLE IF NOT EXISTS public.coach_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id),
  question_text text NOT NULL,
  answer_text text NOT NULL,
  -- Evaluation scores
  star_score decimal(3,1),      -- 0-10: did they use STAR method?
  clarity_score decimal(3,1),   -- 0-10: was it clear and structured?
  technical_score decimal(3,1), -- 0-10: technical accuracy
  confidence_score decimal(3,1),-- 0-10: delivery confidence
  overall_score decimal(3,1),   -- 0-10: weighted average
  -- Detailed feedback
  filler_word_count integer DEFAULT 0,
  filler_words_detected text[] DEFAULT '{}',
  missing_points text[] DEFAULT '{}',
  -- what ideal answer should have covered
  strengths_in_answer text[] DEFAULT '{}',
  improvements text[] DEFAULT '{}',
  feedback_text text,
  -- full feedback shown to user
  follow_up_asked text,
  -- the follow-up question generated
  embedding vector(2048),
  -- embed the answer for future similarity search
  created_at timestamptz DEFAULT now()
);

-- User weakness tracking (updated after each session)
CREATE TABLE IF NOT EXISTS public.user_weaknesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  -- behavioral, technical, etc.
  weakness_description text NOT NULL,
  occurrence_count integer DEFAULT 1,
  last_seen_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  UNIQUE(user_id, category, weakness_description)
);

-- RLS policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS questions_public_read ON public.questions;
CREATE POLICY "questions_public_read" ON public.questions FOR SELECT TO authenticated USING (true);

ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coach_sessions_own ON public.coach_sessions;
CREATE POLICY "coach_sessions_own" ON public.coach_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.coach_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coach_answers_own ON public.coach_answers;
CREATE POLICY "coach_answers_own" ON public.coach_answers FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.user_weaknesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS weaknesses_own ON public.user_weaknesses;
CREATE POLICY "weaknesses_own" ON public.user_weaknesses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Function for pgvector similarity match
CREATE OR REPLACE FUNCTION public.match_questions(
  query_embedding vector(2048),
  match_count integer,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  text text,
  category text,
  difficulty text,
  role_tags text[],
  follow_up_questions text[],
  ideal_answer_points text[],
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.text,
    q.category,
    q.difficulty,
    q.role_tags,
    q.follow_up_questions,
    q.ideal_answer_points,
    (1 - (q.embedding <=> query_embedding))::double precision AS similarity
  FROM public.questions q
  WHERE (filter_category IS NULL OR q.category = filter_category)
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
