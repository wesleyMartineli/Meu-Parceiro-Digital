import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";
import DashboardEstrategicoClient from "./DashboardEstrategicoClient";

export const metadata = {
  title: "Dashboard Estratégico - Meu Parceiro Digital",
};

export default async function DashboardEstrategicoPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const company = await getActiveCompany();
  const empresaId = company?.id;

  if (!empresaId) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl max-w-6xl mx-auto mt-8">
        <h3 className="font-bold text-lg">Erro de Inquilino</h3>
        <p className="text-sm mt-1 font-light">Seu usuário não está associado a nenhuma empresa cadastrada.</p>
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Busca todos os usuários ativos para estruturar a hierarquia
  const { data: todosUsuarios, error: errUsuarios } = await supabase
    .from("usuarios")
    .select("id, nome, role, supervisor_id")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (errUsuarios) {
    console.error("Erro ao carregar usuários na hierarquia:", errUsuarios);
  }

  const allUsersList = todosUsuarios || [];

  // Função recursiva para obter subordinados diretos e indiretos
  const getDescendantIds = (parentId: string, allUsers: typeof allUsersList): string[] => {
    const children = allUsers.filter((u) => u.supervisor_id === parentId);
    let ids = children.map((c) => c.id);
    for (const child of children) {
      ids = ids.concat(getDescendantIds(child.id, allUsers));
    }
    return ids;
  };

  const isMasterOrDirector =
    user.role === "master" ||
    user.role === "diretoria" ||
    user.role === "platform_admin";

  let allowedUserIds: string[] | null = null;
  let usuariosHierarquia: { id: string; nome: string; role: string; supervisor_id: string | null }[] = [];

  if (isMasterOrDirector) {
    allowedUserIds = null;
    usuariosHierarquia = allUsersList.map((u) => ({
      id: u.id,
      nome: u.nome,
      role: u.role,
      supervisor_id: u.supervisor_id,
    }));
  } else if (user.role === "superintendente" || user.role === "regional") {
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
    // Gerente de Negócio ou Ponto de Venda
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

  // 2. Busca Tarefas (Follow-ups) com dados do parceiro (lead) e do responsável
  let tarefasQuery = supabase
    .from("followups")
    .select(`
      id,
      lead_id,
      vendedor_id,
      titulo,
      descricao,
      data_followup,
      status,
      tipo,
      created_at,
      leads (
        id,
        nome,
        tipo_parceiro
      ),
      usuarios (
        id,
        nome
      )
    `)
    .eq("empresa_id", empresaId)
    .order("data_followup", { ascending: true });

  if (allowedUserIds !== null) {
    if (allowedUserIds.length === 1) {
      tarefasQuery = tarefasQuery.eq("vendedor_id", allowedUserIds[0]);
    } else {
      tarefasQuery = tarefasQuery.in("vendedor_id", allowedUserIds);
    }
  }

  const { data: tarefasData, error: errTarefas } = await tarefasQuery;
  if (errTarefas) {
    console.error("Erro ao carregar tarefas:", errTarefas);
  }

  // 3. Busca Negócios do CRM (oportunidades/carteira)
  let negociosQuery = supabase
    .from("negocios_crm")
    .select(`
      id,
      cliente_id,
      vendedor_id,
      titulo,
      credito,
      modalidade,
      etapa_funil,
      temperatura,
      created_at,
      updated_at,
      leads (
        id,
        nome,
        tipo_parceiro,
        cidade,
        estado
      ),
      usuarios (
        id,
        nome,
        role
      )
    `)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (allowedUserIds !== null) {
    if (allowedUserIds.length === 1) {
      negociosQuery = negociosQuery.eq("vendedor_id", allowedUserIds[0]);
    } else {
      negociosQuery = negociosQuery.in("vendedor_id", allowedUserIds);
    }
  }

  const { data: negociosData, error: errNegocios } = await negociosQuery;
  if (errNegocios) {
    console.error("Erro ao carregar negócios:", errNegocios);
  }

  // 4. Busca Parceiros da Carteira (leads)
  let parceirosQuery = supabase
    .from("leads")
    .select("id, nome, tipo_parceiro, codigo_pv, cidade, estado, vendedor_id")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });

  if (allowedUserIds !== null) {
    if (allowedUserIds.length === 1) {
      parceirosQuery = parceirosQuery.eq("vendedor_id", allowedUserIds[0]);
    } else {
      parceirosQuery = parceirosQuery.in("vendedor_id", allowedUserIds);
    }
  }

  const { data: parceirosData, error: errParceiros } = await parceirosQuery;
  if (errParceiros) {
    console.error("Erro ao carregar parceiros:", errParceiros);
  }

  return (
    <DashboardEstrategicoClient
      user={user}
      negocios={negociosData || []}
      tarefas={tarefasData || []}
      parceiros={parceirosData || []}
      usuariosHierarquia={usuariosHierarquia}
      nomeEmpresa={company.nome_empresa}
    />
  );
}
