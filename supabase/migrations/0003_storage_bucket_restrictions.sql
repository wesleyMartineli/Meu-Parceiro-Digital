-- Migration: 0003_storage_bucket_restrictions
-- Objetivo: Restringir MIME types e tamanho de arquivo nos buckets do Supabase Storage.

-- Bucket 'propostas': apenas PDF, limite de 8MB
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['application/pdf'],
  file_size_limit    = 8388608
WHERE id = 'propostas';
