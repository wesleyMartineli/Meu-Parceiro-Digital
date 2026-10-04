import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicPropostaClient from "./PublicPropostaClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Dynamic route

export default async function PublicPropostaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Retrieve the public proposal details using our deployed RPC
  const { data: proposta, error } = await (supabase as any).rpc("get_public_proposal_details", {
    p_id: id,
  });

  if (error || !proposta || !(proposta as any).id) {
    console.error("Public proposal load error:", error);
    notFound();
  }

  // Force Rodobens Identity
  proposta.empresa = {
    nome_empresa: "Rodobens",
    logo_url: "/brand/LogoRodobens.png",
    cor_primaria: "#00CF7B",
    cor_secundaria: "#00441F",
    telefone: null,
  };

  // Fetch correct Gerente from propostas table
  const { data: propData } = await supabase
    .from("propostas")
    .select("vendedor_id, usuarios(nome, email, telefone)")
    .eq("id", id)
    .single();

  if (propData?.usuarios) {
    proposta.gerente = {
      nome: propData.usuarios.nome,
      email: propData.usuarios.email,
      telefone: propData.usuarios.telefone || "",
    };
  }

  return <PublicPropostaClient proposta={proposta as any} />;
}
