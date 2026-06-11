-- supabase/migrations/005_documents_storage.sql

-- Storage bucket (run via Supabase dashboard OR migration)
-- Create via dashboard: Storage → New bucket → "documents" → Private

-- RLS policy for storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own files
-- File path pattern: {userId}/{filename}
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add processed_at + error columns to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_error text,
  ADD COLUMN IF NOT EXISTS file_size_bytes integer,
  ADD COLUMN IF NOT EXISTS mime_type text;

-- Supabase webhook trigger: notify Python service on insert
-- (Set up manually in Supabase dashboard → Database → Webhooks)
-- Webhook: INSERT on public.documents → POST {TRANSCRIPTION_SERVICE_URL}/webhooks/document-created
-- Header: x-webhook-secret: {WEBHOOK_SECRET}
