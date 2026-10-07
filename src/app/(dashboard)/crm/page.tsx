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

  // 1. Busca todos os usuários para calcular a estrutura hierárquica
  const { data: todosUsuarios, error: errUsuarios } = await supabase
    .from('usuarios')
    .select('id, nome, role, supervisor_id')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (errUsuarios) {
    console.error('Erro ao carregar usuários:', errUsuarios);
  }

  const allUsersList = todosUsuarios || [];

  // Função recursiva para buscar toda a cadeia de subordinados (para baixo)
  const getDescendantIds = (parentId: string, allUsers: any[]): string[] => {
    const children = allUsers.filter((u) => u.supervisor_id === parentId);
    let ids = children.map((c) => c.id);
    for (const child of children) {
      ids = ids.concat(getDescendantIds(child.id, allUsers));
    }
    return ids;
  };

  // 2. Determina o escopo de IDs de vendedores permitidos de acordo com o papel na hierarquia
  let allowedUserIds: string[] | null = null;
  let usuariosHierarquia: { id: string; nome: string; role: string; supervisor_id: string | null }[] = [];

  const isMasterOrDirector =
    user.role === 'master' ||
    user.role === 'diretoria' ||
    user.role === 'platform_admin';

  if (isMasterOrDirector) {
    // Diretoria e Master têm visão global de todos os negócios
    allowedUserIds = null;
    usuariosHierarquia = allUsersList.map((u) => ({
      id: u.id,
      nome: u.nome,
      role: u.role,
      supervisor_id: u.supervisor_id,
    }));
  } else if (user.role === 'superintendente' || user.role === 'regional') {
    // Liderança vê seus próprios negócios e de todos os seus subordinados diretos e indiretos
    const descendantIds = getDescendantIds(user.id, allUsersList);
    allowedUserIds = [user.id, ...descendantIds];
    usuariosHierarquia = allUsersList
      .filter((u) => allowedUserIds!.includes(u.id))
      .map((u) => ({
        id: u.id,
        nome: u.nome,
        role: u.role,
        supervisor_id: u.supervisor_id,
      }));
  } else {
    // Gerente de Negócios / Ponto de Venda vê apenas seus próprios negócios
    allowedUserIds = [user.id];
    usuariosHierarquia = allUsersList
      .filter((u) => u.id === user.id)
      .map((u) => ({
        id: u.id,
        nome: u.nome,
        role: u.role,
        supervisor_id: u.supervisor_id,
      }));
  }

  // 3. Query de negócios no CRM
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
        id,
        nome,
        telefone
      ),
      usuarios (
        id,
        nome,
        role
      ),
      propostas:propostas!negocios_crm_proposta_id_fkey (
        id,
        simulacoes (
          produto
        )
      )
    `)
    .neq('etapa_funil', 'novo_lead');

  // Aplica filtro de escopo por hierarquia
  if (allowedUserIds !== null) {
    if (allowedUserIds.length === 1) {
      query = query.eq('vendedor_id', allowedUserIds[0]);
    } else {
      query = query.in('vendedor_id', allowedUserIds);
    }
  }

  const { data: negocios, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar negócios:', error);
  }

  return (
    <MeusNegociosClient
      negocios={(negocios as any) || []}
      gerentes={usuariosHierarquia}
      usuariosHierarquia={usuariosHierarquia}
      currentUser={{
        id: user.id,
        role: user.role,
        nome: user.nome || '',
      }}
    />
  );
}
