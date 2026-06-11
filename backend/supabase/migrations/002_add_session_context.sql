-- Add extra_context and role_hint columns to the sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS extra_context TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS role_hint TEXT;
