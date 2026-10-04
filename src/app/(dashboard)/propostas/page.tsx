import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from '@/lib/supabase/server';
import PropostasClient from './PropostasClient';

export default async function PropostasPage() {
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

  let query = (supabase as any)
    .from('propostas')
    .select(`
      id,
      created_at,
      status,
      visualizacoes,
      pdf_url,
      public_link,
      gerente:usuarios(nome),
      lead:leads(nome),
      simulacao:simulacoes(credito_total, produto, modalidade)
    `)
    ;

  // Se for gerente comum, só vê suas próprias propostas
  if (user.role === 'gerente_negocio') {
    query = query.eq('vendedor_id', user.id);
  }

  const { data: propostas, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar propostas:', error);
  }

  return (
    <PropostasClient
      propostas={(propostas as any) || []}
      gerenteRole={user.role}
    />
  );
}
