import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from '@/lib/supabase/server';
import ClientesClient from './ClientesClient';

export default async function ClientesPage() {
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

  // Busca os gerentes da empresa para filtros
  const { data: gerentes } = await supabase
    .from('usuarios')
    .select('id, nome')
    
    .in('role', ['gerente_negocio', 'ponto_venda'])
    .order('nome', { ascending: true });

  // Query de clientes (leads)
  let query = supabase
    .from('leads')
    .select(`
      id,
      nome,
      email,
      telefone,
      origem,
      observacoes,
      vendedor_id,
      created_at,
      tipo_parceiro,
      etapa_funil,
      usuarios (
        nome
      ),
      negocios_crm (
        id,
        credito,
        etapa_funil,
        titulo
      )
    `)
    ;

  if (user.role === 'gerente_negocio' || user.role === 'ponto_venda') {
    query = query.eq('vendedor_id', user.id);
  }

  const { data: clientes, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar clientes:', error);
  }

  // Calculate valor_total from negocios_crm directly
  const clientesTransformados = (clientes || []).map((cliente: any) => {
    let valorTotal = 0;
    let propostasAtivas = 0;
    if (cliente.negocios_crm && Array.isArray(cliente.negocios_crm)) {
      cliente.negocios_crm.forEach((neg: any) => {
        valorTotal += Number(neg.credito || 0);
        if (neg.etapa_funil !== 'perdido') {
          propostasAtivas++;
        }
      });
    }

    let etapaCalculada = cliente.etapa_funil;

    // Fallback para Parceiros antigos que estão com a etapa errada (ex: sem_contato)
    if (cliente.tipo_parceiro === 'lead' && !['mapeado', 'em_qualificacao', 'em_nomeacao', 'perdido'].includes(etapaCalculada)) {
      etapaCalculada = 'mapeado';
    }

    if (cliente.tipo_parceiro === 'base' && etapaCalculada !== 'perdido') {
      if (valorTotal >= 100000) {
        etapaCalculada = 'base_gerando_oportunidades';
      } else if (valorTotal > 0) {
        etapaCalculada = 'base_em_nutricao';
      } else {
        etapaCalculada = 'base_sem_oportunidades';
      }
    }

    return {
      ...cliente,
      etapa_funil: etapaCalculada,
      valor_total: valorTotal,
      propostas_ativas: propostasAtivas
    };
  });

  return (
    <ClientesClient
      clientes={clientesTransformados}
      gerentes={(gerentes as any) || []}
      currentUser={{
        id: user.id,
        role: user.role,
              }}
    />
  );
}
