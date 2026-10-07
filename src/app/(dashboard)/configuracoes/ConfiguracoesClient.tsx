"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone, Shield, Save, Check } from "lucide-react";

interface ConfiguracoesClientProps {
  user: any;
}

export default function ConfiguracoesClient({ user }: ConfiguracoesClientProps) {
  const supabase = createClient();

  // States para Meu Perfil
  const [nomeUsuario, setNomeUsuario] = useState(user.nome || "");
  const [telefoneUsuario, setTelefoneUsuario] = useState(user.telefone || "");
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return "";
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{0,4})(\d{0,4}).*/, (match, p1, p2, p3) => {
        let res = `(${p1}`;
        if (p2) res += `) ${p2}`;
        if (p3) res += `-${p3}`;
        return res;
      });
    }
    return cleaned.replace(/(\d{2})(\d{0,5})(\d{0,4}).*/, (match, p1, p2, p3) => {
      let res = `(${p1}`;
      if (p2) res += `) ${p2}`;
      if (p3) res += `-${p3}`;
      return res;
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "diretoria":
        return "Diretoria";
      case "superintendente":
        return "Superintendente";
      case "regional":
        return "Regional Comercial";
      case "gerente_negocio":
        return "Gerente de Negócios";
      case "ponto_venda":
        return "Ponto de Venda";
      case "master":
      case "platform_admin":
        return "Administrador Master";
      default:
        return role;
    }
  };

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPerfil(true);
    setSaveSuccess(false);

    const { error } = await supabase
      .from("usuarios")
      .update({ nome: nomeUsuario, telefone: telefoneUsuario })
      .eq("id", user.id);

    setLoadingPerfil(false);
    if (error) {
      alert("Erro ao salvar perfil. Tente novamente.");
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#00441F]">
              Configurações ⚙️
            </h1>
            <p className="text-sm text-[#00441F]/80 font-medium mt-1">
              Gerencie seus dados de perfil e informações de acesso.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00CF7B]/15 text-[#00441F] border border-[#00CF7B]/30">
            <Shield className="w-3.5 h-3.5 text-[#00441F]" />
            {getRoleBadge(user.role)}
          </span>
        </div>
      </div>

      {/* FORMULÁRIO DO PERFIL */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="border-b border-[#E0E5CF] pb-4 mb-6">
          <h2 className="text-base font-extrabold text-[#00441F]">Meu Perfil</h2>
          <p className="text-xs text-[#00441F]/70 mt-0.5">
            Atualize suas informações pessoais de contato.
          </p>
        </div>

        <form onSubmit={handleSavePerfil} className="space-y-5 max-w-xl">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#00441F] mb-1.5">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00441F]/60" />
              <input
                type="text"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Seu nome completo"
                required
                className="w-full bg-white border border-[#E0E5CF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#00441F] font-medium focus:outline-none focus:ring-2 focus:ring-[#00CF7B] shadow-xs"
              />
            </div>
          </div>

          {/* E-mail (somente leitura) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#00441F] mb-1.5">
              E-mail de Acesso (Leitura)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full border border-[#E0E5CF] bg-gray-100/70 text-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-not-allowed shadow-xs"
              />
            </div>
            <span className="text-[11px] text-[#00441F]/60 mt-1 block">
              O e-mail é utilizado para autenticação e não pode ser alterado diretamente.
            </span>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#00441F] mb-1.5">
              Telefone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00441F]/60" />
              <input
                type="text"
                value={telefoneUsuario}
                onChange={(e) => setTelefoneUsuario(formatPhone(e.target.value))}
                maxLength={15}
                placeholder="(11) 99999-9999"
                className="w-full bg-white border border-[#E0E5CF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#00441F] font-medium focus:outline-none focus:ring-2 focus:ring-[#00CF7B] shadow-xs"
              />
            </div>
          </div>

          {/* Cargo / Perfil */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#00441F] mb-1.5">
              Nível de Acesso
            </label>
            <div className="flex items-center gap-2 p-3 bg-white border border-[#E0E5CF] rounded-xl text-sm font-semibold text-[#00441F]">
              <Shield className="w-4 h-4 text-[#00CF7B]" />
              <span>{getRoleBadge(user.role)}</span>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="pt-3 flex items-center gap-4">
            <button
              type="submit"
              disabled={loadingPerfil}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00CF7B] text-white text-sm font-bold rounded-xl hover:bg-[#00441F] transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loadingPerfil ? "Salvando..." : "Salvar Alterações"}
            </button>

            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600" />
                Perfil atualizado com sucesso!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
