DROP POLICY IF EXISTS "Leitura permitida para master, platform_admin e gerente_negocio" ON public.materiais_apoio;
CREATE POLICY "Leitura permitida para master, platform_admin e gerente_negocio"
ON public.materiais_apoio
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.role IN ('master', 'platform_admin', 'gerente_negocio', 'superintendente', 'regional', 'ponto_venda')
  )
);
