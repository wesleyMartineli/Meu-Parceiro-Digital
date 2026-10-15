-- Migration: 0013_allow_png_propostas_bucket.sql
-- Objetivo: Permitir upload de imagens PNG (propostas simplificadas) além de PDF no bucket 'propostas'.

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['application/pdf', 'image/png'],
  file_size_limit    = 8388608
WHERE id = 'propostas';
