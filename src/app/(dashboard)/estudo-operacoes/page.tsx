import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from '@/lib/supabase/server';
import EstudoOperacoesClient from './EstudoOperacoesClient';

export default async function EstudoOperacoesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const company = await getActiveCompany();
  const empresaId = company?.id;

  if (!empresaId) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // 1. Buscar leads da empresa
  let leadsQuery = (supabase as any)
    .from('leads')
    .select('id, nome')
    ;

  if (user.role === 'gerente_negocio') {
    leadsQuery = leadsQuery.eq('vendedor_id', user.id);
  }

  const { data: leads } = await leadsQuery.order('nome', { ascending: true });

  // 2. Buscar administradoras ativas
  const { data: administradorasRaw } = await (supabase as any)
    .from('administradoras')
    .select('id, nome, slug, engine_key, empresa_administradoras!inner(empresa_id, ativa)')
    .eq('ativa', true)
    .eq('empresa_administradoras.empresa_id', empresaId)
    .eq('empresa_administradoras.ativa', true)
    .order('nome', { ascending: true });

  const administradoras = administradorasRaw?.map((a: any) => ({
    id: a.id,
    nome: a.nome,
    slug: a.slug,
    engine_key: a.engine_key
  })) || [];

  const { data: empresa } = await (supabase as any)
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  return (
    <EstudoOperacoesClient
      leads={leads || []}
      administradoras={administradoras || []}
      empresa={empresa || null}
      usuario={user}
    />
  );
}
