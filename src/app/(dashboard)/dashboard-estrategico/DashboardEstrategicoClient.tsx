"use client";

import React from "react";
import { UserProfile } from "@/lib/supabase/helpers";
import {
  DashboardLead,
  DashboardNegocio,
  DashboardTarefa,
  UsuarioHierarquia,
  DashboardEstrategico,
} from "@/modules/dashboard";

interface DashboardEstrategicoClientProps {
  user: UserProfile | null;
  negocios: DashboardNegocio[];
  tarefas: DashboardTarefa[];
  parceiros: DashboardLead[];
  usuariosHierarquia: UsuarioHierarquia[];
  nomeEmpresa?: string;
}

export default function DashboardEstrategicoClient(props: DashboardEstrategicoClientProps) {
  return <DashboardEstrategico {...props} />;
}
