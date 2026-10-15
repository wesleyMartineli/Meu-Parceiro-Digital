-- 1. Recria função de hierarquia
CREATE OR REPLACE FUNCTION public.is_subordinate(supervisor_id_param uuid, subordinate_id_param uuid)
RETURNS boolean AS $$
DECLARE
  is_sub boolean;
BEGIN
  IF supervisor_id_param IS NULL OR subordinate_id_param IS NULL THEN
    RETURN false;
  END IF;

  IF supervisor_id_param = subordinate_id_param THEN
    RETURN true;
  END IF;

  WITH RECURSIVE subordinates AS (
    SELECT id, supervisor_id FROM public.usuarios WHERE id = supervisor_id_param
    UNION ALL
    SELECT u.id, u.supervisor_id FROM public.usuarios u
    INNER JOIN subordinates s ON u.supervisor_id = s.id
  )
  SELECT EXISTS(SELECT 1 FROM subordinates WHERE id = subordinate_id_param) INTO is_sub;
  RETURN coalesce(is_sub, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Atualiza verificação de usuário ativo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean AS $$
DECLARE
  u_role public.user_role;
  u_ativo boolean;
BEGIN
  SELECT role, ativo INTO u_role, u_ativo
  FROM public.usuarios
  WHERE id = auth.uid();
  
  IF u_role IN ('platform_admin'::public.user_role, 'master'::public.user_role) THEN
    RETURN true;
  END IF;
  
  IF u_ativo = false OR u_ativo IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Atualiza políticas de acesso na tabela usuarios
ALTER POLICY "usuarios_select" ON public.usuarios
USING (
  id = auth.uid()
  OR (get_auth_user_role() = ANY(ARRAY['platform_admin'::user_role, 'master'::user_role]))
  OR is_subordinate(auth.uid(), id)
  OR supervisor_id = auth.uid()
  OR (empresa_id IS NOT NULL AND empresa_id = get_auth_user_empresa())
);

ALTER POLICY "usuarios_self_update" ON public.usuarios
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

ALTER POLICY "usuarios_write_admin" ON public.usuarios
USING (
  (get_auth_user_role() = ANY(ARRAY['platform_admin'::user_role, 'master'::user_role]))
  OR is_subordinate(auth.uid(), id)
);

-- 4. Garante empresa padrão para usuários existentes
UPDATE public.usuarios
SET empresa_id = '43605699-aaf9-4caf-872a-2526e728ddd6'
WHERE empresa_id IS NULL;
