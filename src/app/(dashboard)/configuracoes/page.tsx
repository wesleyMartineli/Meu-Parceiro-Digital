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

  return (
    <ConfiguracoesClient user={user} />
  );
}
