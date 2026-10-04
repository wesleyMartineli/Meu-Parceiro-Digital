-- Criação da tabela materiais_apoio
CREATE TABLE public.materiais_apoio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo varchar(255) NOT NULL,
  descricao text,
  categoria varchar(100),
  arquivo_url text NOT NULL,
  arquivo_nome text NOT NULL,
  arquivo_tipo varchar(50) NOT NULL,
  tamanho_bytes bigint,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.materiais_apoio ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para materiais_apoio
-- Permitir leitura para master, platform_admin, e gerente_negocio
CREATE POLICY "Leitura permitida para master, platform_admin e gerente_negocio"
ON public.materiais_apoio
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master', 'gerente_negocio', 'superintendente', 'regional', 'ponto_venda')
  )
);

-- Permitir inserção apenas para master e platform_admin
CREATE POLICY "Insercao apenas para master e platform_admin"
ON public.materiais_apoio
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master')
  )
);

-- Permitir atualização apenas para master e platform_admin
CREATE POLICY "Atualizacao apenas para master e platform_admin"
ON public.materiais_apoio
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master')
  )
);

-- Permitir deleção apenas para master e platform_admin
CREATE POLICY "Delecao apenas para master e platform_admin"
ON public.materiais_apoio
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master')
  )
);

-- Inserir o bucket materiais_apoio no storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materiais_apoio',
  'materiais_apoio',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas do Storage para o bucket materiais_apoio
CREATE POLICY "Leitura publica do bucket materiais_apoio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'materiais_apoio');

CREATE POLICY "Upload permitido para master e platform_admin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'materiais_apoio' AND
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master')
  )
);

CREATE POLICY "Delete permitido para master e platform_admin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'materiais_apoio' AND
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master')
  )
);
