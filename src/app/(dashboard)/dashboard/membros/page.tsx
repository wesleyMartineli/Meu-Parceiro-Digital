import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import MembrosClient from './MembrosClient';

export default async function MembrosPage() {
  const user = await getCurrentUser();
  const company = await getActiveCompany();

  if (!user) {
    redirect('/login');
  }

  // Apenas empresa_admin (gerente) ou platform_admin podem acessar esta tela de equipe
  if (user.role !== 'superintendente' && user.role !== 'master') {
    redirect('/dashboard');
  }

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

  // Busca os dados da empresa e seu plano
  const { data: empresaData, error: empError } = await supabase
    .from('empresas')
    .select(`
      nome_empresa,
      planos (
        nome,
        limite_gerentes
      )
    `)
    .eq('id', empresaId)
    .single();

  if (empError) {
    console.error('Erro ao buscar dados da empresa:', empError);
  }

  // Busca os gerentes ativos e inativos
  const { data: gerentes, error } = await supabase
    .from('usuarios')
    .select('*')
    
    .eq('role', 'gerente_negocio')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar gerentes:', error);
  }

  const planoInfo = empresaData?.planos ? {
    nome: (empresaData.planos as any).nome,
    limite: (empresaData.planos as any).limite_gerentes
  } : null;

  return (
    <MembrosPageContent
      gerentes={(gerentes as any) || []}
      empresaId={empresaId}
      planoInfo={planoInfo}
    />
  );
}

function MembrosPageContent({ gerentes, empresaId, planoInfo }: { gerentes: any[]; empresaId: string; planoInfo: any }) {
  return (
    <div className="max-w-5xl mx-auto">
      <MembrosClient gerentes={gerentes} empresaId={empresaId} planoInfo={planoInfo} />
    </div>
  );
}
