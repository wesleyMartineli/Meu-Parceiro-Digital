import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from '@/lib/supabase/server';
import MeusNegociosClient from './MeusNegociosClient';

export default async function CRMPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const company = await getActiveCompany();
  const empresaId = company?.id;

  if (!empresaId) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl">
        <h3 className="font-bold text-lg">Erro de Inquilino</h3>
        <p className="text-sm mt-1 font-light">Seu usuário não está associado a nenhuma empresa cadastrada.</p>
      </div>
    );
  }

  const supabase = await createClient();

  // Busca os gerentes da empresa para filtros e cadastros
  const { data: gerentes } = await supabase
    .from('usuarios')
    .select('id, nome')
    
    .in('role', ['gerente_negocio', 'superintendente'])
    .order('nome', { ascending: true });

  // Query de negócios
  let query = supabase
    .from('negocios_crm')
    .select(`
      id,
      cliente_id,
      proposta_id,
      titulo,
      credito,
      modalidade,
      administradora,
      etapa_funil,
      origem,
      proximo_followup,
      ultima_interacao,
      motivo_perda,
      vendedor_id,
      created_at,
      updated_at,
      leads (
        nome,
        telefone
      ),
      usuarios (
        nome
      )
    `)
    
    .neq('etapa_funil', 'novo_lead');

  // Se o usuário for gerente comum, ele só enxerga os seus próprios negócios
  if (user.role === 'gerente_negocio') {
    query = query.eq('vendedor_id', user.id);
  }

  const { data: negocios, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar negócios:', error);
  }

  return (
    <MeusNegociosClient
      negocios={(negocios as any) || []}
      gerentes={(gerentes as any) || []}
      currentUser={{
        id: user.id,
        role: user.role,
              }}
    />
  );
}
