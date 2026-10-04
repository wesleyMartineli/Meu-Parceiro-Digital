-- Permitir inserção para master e platform_admin na tabela
DROP POLICY IF EXISTS "Insercao apenas para master e platform_admin" ON public.materiais_apoio;
CREATE POLICY "Insercao apenas para master e platform_admin"
ON public.materiais_apoio
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master', 'platform_admin')
  )
);

-- Permitir atualização para master e platform_admin na tabela
DROP POLICY IF EXISTS "Atualizacao apenas para master e platform_admin" ON public.materiais_apoio;
CREATE POLICY "Atualizacao apenas para master e platform_admin"
ON public.materiais_apoio
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master', 'platform_admin')
  )
);

-- Permitir deleção para master e platform_admin na tabela
DROP POLICY IF EXISTS "Delecao apenas para master e platform_admin" ON public.materiais_apoio;
CREATE POLICY "Delecao apenas para master e platform_admin"
ON public.materiais_apoio
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master', 'platform_admin')
  )
);

-- Políticas do Storage para o bucket materiais_apoio
DROP POLICY IF EXISTS "Upload permitido para master e platform_admin" ON storage.objects;
CREATE POLICY "Upload permitido para master e platform_admin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'materiais_apoio' AND
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master', 'platform_admin')
  )
);

DROP POLICY IF EXISTS "Delete permitido para master e platform_admin" ON storage.objects;
CREATE POLICY "Delete permitido para master e platform_admin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'materiais_apoio' AND
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master', 'platform_admin')
  )
);
