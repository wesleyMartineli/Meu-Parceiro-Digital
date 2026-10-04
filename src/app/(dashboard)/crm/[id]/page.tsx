import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from '@/lib/supabase/server';
import LeadDetailClient from './LeadDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id: leadId } = await params;
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

  // 1. Busca os detalhes do lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(`
      id,
      nome,
      email,
      telefone,
      etapa_funil,
      origem,
      observacoes,
      vendedor_id,
      usuarios (
        nome
      )
    `)
    .eq('id', leadId)
    
    .maybeSingle();

  if (leadError || !lead) {
    console.error('Erro ao carregar lead:', leadError);
    redirect('/crm');
  }

  const leadData = lead as any;

  // Se o usuário for gerente comum, ele só pode acessar os seus próprios leads
  if (user.role === 'gerente_negocio' && leadData.vendedor_id !== user.id) {
    redirect('/crm');
  }

  // 2. Busca gerentes da empresa
  const { data: gerentes } = await supabase
    .from('usuarios')
    .select('id, nome')
    
    .in('role', ['gerente_negocio', 'superintendente'])
    .order('nome', { ascending: true });

  // 3. Busca histórico de followups
  const { data: followups } = await supabase
    .from('followups')
    .select('*')
    .eq('lead_id', leadId)
    .order('data_followup', { ascending: true });

  // 4. Busca simulações calculadas para este lead
  const { data: simulacoes } = await supabase
    .from('simulacoes')
    .select('id, produto, modalidade, credito_total, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  // 5. Busca propostas geradas para este lead
  const { data: propostas } = await supabase
    .from('propostas')
    .select('id, status, created_at, visualizacoes')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  return (
    <LeadDetailPageContent
      lead={leadData}
      gerentes={(gerentes as any) || []}
      followups={(followups as any) || []}
      simulacoes={(simulacoes as any) || []}
      propostas={(propostas as any) || []}
      currentUser={{
        id: user.id,
        role: user.role,
      }}
    />
  );
}

function LeadDetailPageContent({
  lead,
  gerentes,
  followups,
  simulacoes,
  propostas,
  currentUser,
}: {
  lead: any;
  gerentes: any[];
  followups: any[];
  simulacoes: any[];
  propostas: any[];
  currentUser: any;
}) {
  return (
    <div className="max-w-6xl mx-auto">
      <LeadDetailClient
        lead={lead}
        gerentes={gerentes}
        followups={followups}
        simulacoes={simulacoes}
        propostas={propostas}
        currentUser={currentUser}
      />
    </div>
  );
}
