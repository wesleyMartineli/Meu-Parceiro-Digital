import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";
import ConfiguracoesClient from "./ConfiguracoesClient";

export const metadata = {
  title: "Configurações - Meu Parceiro Digital",
};

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  let empresa = null;
  let administradoras: any[] = [];
  let empresaAdministradoras: any[] = [];

  // Se for master ou gerente, buscamos a empresa e as administradoras
  if (user.role !== "gerente_negocio" && (user as any).empresa_id) {
    const { data: emp } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", (user as any).empresa_id)
      .single();
    empresa = emp;

    const { data: admins } = await supabase
      .from("administradoras")
      .select("*")
      .eq("ativa", true)
      .order("nome", { ascending: true });
    administradoras = admins || [];

    const { data: empAdmins } = await supabase
      .from("empresa_administradoras")
      .select("*")
      .eq("empresa_id", (user as any).empresa_id);
    empresaAdministradoras = empAdmins || [];
  }

  return (
    <ConfiguracoesClient
      user={user}
      empresa={empresa}
      administradoras={administradoras}
      empresaAdministradoras={empresaAdministradoras}
    />
  );
}
