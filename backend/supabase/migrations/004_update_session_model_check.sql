-- Drop the old constraint
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_model_check;

-- Add the new constraint allowing the new model IDs (and keeping old ones for backward compatibility)
ALTER TABLE public.sessions ADD CONSTRAINT sessions_model_check 
  CHECK (model IN ('claude', 'gpt-5', 'abacusai/dracarys-llama-3.1-70b-instruct', 'mistralai/mistral-large'));
