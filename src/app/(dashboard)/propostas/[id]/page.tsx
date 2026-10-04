import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import PropostaDetalheClient from './PropostaDetalheClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropostaDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: proposta, error } = await (supabase as any)
    .from('propostas')
    .select(`
      id,
      created_at,
      status,
      visualizacoes,
      pdf_url,
      public_link,
      empresa:empresas(nome_empresa, cor_primaria, cor_secundaria, logo_url, telefone),
      gerente:usuarios(nome, email, telefone),
      lead:leads(id, nome, telefone, observacoes),
      simulacao:simulacoes(id, credito_total, produto, modalidade, input_json, output_json)
    `)
    .eq('id', id)
    
    .single();

  if (error || !proposta) {
    notFound();
  }

  return (
    <PropostaDetalheClient
      proposta={proposta as any}
    />
  );
}
