import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import RelatoriosMasterClient from './RelatoriosMasterClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminRelatoriosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'master' && user.role !== 'platform_admin' && user.role !== 'diretoria') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // 1. Usuários da hierarquia
  const { data: usuariosData } = await supabase
    .from('usuarios')
    .select('id, nome, email, role, supervisor_id, ativo')
    .order('nome', { ascending: true });

  // 2. Leads / Parceiros
  const { data: leadsData } = await supabase
    .from('leads')
    .select('id, nome, vendedor_id, created_at, tipo_parceiro, codigo_pv, cidade, estado')
    .order('created_at', { ascending: false });

  // 3. Negócios CRM
  const { data: negociosData } = await supabase
    .from('negocios_crm')
    .select('id, titulo, credito, etapa_funil, vendedor_id, cliente_id, created_at, updated_at')
    .order('created_at', { ascending: false });

  return (
    <div className="p-2 sm:p-6">
      <RelatoriosMasterClient
        usuarios={usuariosData || []}
        leads={leadsData || []}
        negocios={negociosData || []}
      />
    </div>
  );
}

