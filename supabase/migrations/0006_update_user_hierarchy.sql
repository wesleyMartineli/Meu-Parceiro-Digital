-- Add 'diretoria' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'diretoria' AFTER 'master';

-- Rename vendedor_id to gerente_id in all tables
ALTER TABLE public.leads RENAME COLUMN vendedor_id TO gerente_id;
ALTER TABLE public.simulacoes RENAME COLUMN vendedor_id TO gerente_id;
ALTER TABLE public.propostas RENAME COLUMN vendedor_id TO gerente_id;
ALTER TABLE public.campanhas RENAME COLUMN vendedor_id TO gerente_id;
ALTER TABLE public.followups RENAME COLUMN vendedor_id TO gerente_id;
ALTER TABLE public.comissoes RENAME COLUMN vendedor_id TO gerente_id;
ALTER TABLE public.metas RENAME COLUMN vendedor_id TO gerente_id;
