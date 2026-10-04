import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Painel Geral - Meu Parceiro Digital",
};

export default async function DashboardPage() {
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

  // 1. Busca Tarefas Pendentes
  let tarefasQuery = supabase
    .from("followups")
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
    .eq("empresa_id", empresaId)
    .eq("status", "pendente")
    .order("data_followup", { ascending: true })
    .limit(10); // Pegamos apenas as próximas 10 para o dashboard

  if (user.role === "gerente_negocio") {
    tarefasQuery = tarefasQuery.eq("vendedor_id", user.id);
  }

  const { data: tarefasData } = await tarefasQuery;

  // 2. Busca Negócios (para Valor Agregado e Lista)
  let negociosQuery = supabase
    .from("negocios_crm")
    .select(`
      id,
      titulo,
      credito,
      etapa_funil,
      created_at,
      leads (
        nome
      )
    `)
    .eq("empresa_id", empresaId)
    .neq("etapa_funil", "novo_lead")
    .order("created_at", { ascending: false });

  if (user.role === "gerente_negocio") {
    negociosQuery = negociosQuery.eq("vendedor_id", user.id);
  }

  const { data: negociosData } = await negociosQuery;

  return (
    <DashboardClient 
      user={user} 
      negocios={negociosData || []} 
      tarefas={tarefasData || []} 
    />
  );
}
