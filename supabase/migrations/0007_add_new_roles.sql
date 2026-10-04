-- Adiciona os novos cargos no enum de permissões
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'platform_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'diretoria';
