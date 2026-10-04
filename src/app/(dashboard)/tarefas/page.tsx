import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from '@/lib/supabase/server';
import TarefasClient from './TarefasClient';

export const metadata = {
  title: 'Minhas Tarefas - Meu Parceiro Digital',
};

export default async function TarefasPage() {
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

  let query = supabase
    .from('followups')
    .select(`
      id,
      titulo,
      descricao,
      data_followup,
      status,
      tipo,
      created_at,
      leads (
        id,
        nome
      )
    `)
    ;

  // Se o usuário for gerente, mostra apenas as tarefas dele
  if (user.role === 'gerente_negocio') {
    query = query.eq('vendedor_id', user.id);
  }

  query = query.order('data_followup', { ascending: true });

  const { data: followups, error } = await query;

  if (error) {
    console.error('Erro ao buscar tarefas:', error);
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl max-w-5xl mx-auto mt-6">
        <h3 className="font-bold text-lg">Erro ao carregar tarefas</h3>
        <p className="text-sm mt-1 font-light">{error.message}</p>
      </div>
    );
  }

  // Garante tipagem correta pro Client Component
  const tarefasSeguras = (followups || []).map((t: any) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    data_followup: t.data_followup,
    status: t.status,
    tipo: t.tipo,
    created_at: t.created_at,
    leads: {
      id: t.leads?.id || '',
      nome: t.leads?.nome || 'Cliente Desconhecido'
    }
  }));

  // Buscar todos os leads para popular o select de nova tarefa
  let leadsQuery = supabase
    .from('leads')
    .select('id, nome')
    
    .order('nome', { ascending: true });
    
  if (user.role === 'gerente_negocio') {
    leadsQuery = leadsQuery.eq('vendedor_id', user.id);
  }

  const { data: leads } = await leadsQuery;

  return <TarefasClient tarefas={tarefasSeguras} leads={leads || []} />;
}
