import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from '@/lib/supabase/server';
import SimuladorClient from './SimuladorClient';

export default async function SimuladorPage() {
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

  // 1. Buscar leads da empresa (excluindo parceiros do tipo 'lead')
  let leadsQuery = (supabase as any)
    .from('leads')
    .select('id, nome')
    .or('tipo_parceiro.is.null,tipo_parceiro.eq.base');

  // Se for gerente comum, só vê seus próprios leads
  if (user.role === 'gerente_negocio') {
    leadsQuery = leadsQuery.eq('vendedor_id', user.id);
  }

  const { data: leads } = await leadsQuery.order('nome', { ascending: true });

  // 2. Buscar administradoras ativas globalmente E na configuração da empresa
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

  // 3. Buscar empresa
  const { data: empresa } = await (supabase as any)
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  // Buscar campanhas ativas
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('*')
    .eq('status', true)
    .gte('data_fim', new Date().toISOString().split('T')[0])
    .lte('data_inicio', new Date().toISOString().split('T')[0]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SimuladorClient
        leads={leads || []}
        administradoras={administradoras || []}
        empresa={empresa || null}
        usuario={user}
        campanhas={campanhas || []}
      />
    </div>
  );
}
