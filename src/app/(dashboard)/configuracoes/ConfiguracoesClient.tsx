"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadLogoAction } from "@/modules/configuracoes/actions";

interface ConfiguracoesClientProps {
  user: any;
  empresa: any;
  administradoras: any[];
  empresaAdministradoras: any[];
}

export default function ConfiguracoesClient({
  user,
  empresa,
  administradoras,
  empresaAdministradoras,
}: ConfiguracoesClientProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"perfil" | "empresa" | "admins">("perfil");
  const isGerenteNegocio = user.role === "gerente_negocio";

  // States para Meu Perfil
  const [nomeUsuario, setNomeUsuario] = useState(user.nome || "");
  const [telefoneUsuario, setTelefoneUsuario] = useState(user.telefone || "");
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  // States para Empresa
  const [nomeEmpresa, setNomeEmpresa] = useState(empresa?.nome_empresa || "");
  const [razaoSocial, setRazaoSocial] = useState(empresa?.razao_social || "");
  const [cnpjEmpresa, setCnpjEmpresa] = useState(empresa?.cnpj || "");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState(empresa?.telefone || "");
  const [emailContato, setEmailContato] = useState(empresa?.email_contato || "");
  const [logoUrl, setLogoUrl] = useState(empresa?.logo_url || "");
  
  // States para Endereço
  const [cep, setCep] = useState(empresa?.cep || "");
  const [endereco, setEndereco] = useState(empresa?.endereco || "");
  const [numero, setNumero] = useState(empresa?.numero || "");
  const [complemento, setComplemento] = useState(empresa?.complemento || "");
  const [bairro, setBairro] = useState(empresa?.bairro || "");
  const [cidade, setCidade] = useState(empresa?.cidade || "");
  const [estado, setEstado] = useState(empresa?.estado || "");

  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // States para Administradoras
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    administradoras.forEach((admin) => {
      const vinculada = empresaAdministradoras.find(
        (ea) => ea.administradora_id === admin.id
      );
      initial[admin.id] = vinculada ? vinculada.ativa : false;
    });
    return initial;
  });

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

  // Handlers
  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPerfil(true);
    const { error } = await supabase
      .from("usuarios")
      .update({ nome: nomeUsuario, telefone: telefoneUsuario })
      .eq("id", user.id);
    
    setLoadingPerfil(false);
    if (error) {
      alert("Erro ao salvar perfil. Tente novamente.");
    } else {
      alert("Perfil atualizado com sucesso!");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !empresa) return;

    const file = e.target.files[0];

    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Formato não suportado. Envie uma imagem PNG, JPG, WEBP ou GIF.');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('Arquivo muito grande. O limite é 2MB.');
      return;
    }

    setUploadingLogo(true);

    const formData = new FormData();
    formData.append('logo', file);
    formData.append('empresaId', empresa.id);

    const result = await uploadLogoAction(formData);

    if (!result.success) {
      alert(result.message);
    } else if (result.logo_url) {
      setLogoUrl(result.logo_url);
    }

    setUploadingLogo(false);
  };

  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa) return;
    setLoadingEmpresa(true);
    const { error } = await (supabase as any)
      .from("empresas")
      .update({
        nome_empresa: nomeEmpresa,
        razao_social: razaoSocial,
        cnpj: cnpjEmpresa,
        telefone: telefoneEmpresa,
        email_contato: emailContato,
        logo_url: logoUrl,
        cep: cep,
        endereco: endereco,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        estado: estado,
      })
      .eq("id", empresa.id);
    
    setLoadingEmpresa(false);
    if (error) {
      alert("Erro ao salvar empresa. Tente novamente.");
    } else {
      alert("Empresa atualizada com sucesso!");
    }
  };

  const handleToggleAdmin = async (adminId: string, currentStatus: boolean) => {
    if (!empresa) return;
    const newStatus = !currentStatus;
    // Atualiza otimista localmente
    setToggles((prev) => ({ ...prev, [adminId]: newStatus }));

    // Verifica se já existia registro
    const existe = empresaAdministradoras.find((ea) => ea.administradora_id === adminId);

    if (existe) {
      await supabase
        .from("empresa_administradoras")
        .update({ ativa: newStatus })
        .eq("id", existe.id);
    } else {
      await supabase
        .from("empresa_administradoras")
        .insert({
          empresa_id: empresa.id,
          administradora_id: adminId,
          ativa: newStatus,
        });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#00441F]">
          Configurações <span className="grayscale">⚙️</span>
        </h1>
        <p className="text-sm text-[#00441F] font-semibold mt-1 font-medium">
          Gerencie seu perfil e as preferências da conta.
        </p>
      </div>

      {/* ABAS */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("perfil")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "perfil"
              ? "border-[#00CF7B] text-[#00CF7B]"
              : "border-transparent text-[#00441F] font-semibold hover:text-gray-800"
          }`}
        >
          Meu Perfil
        </button>

        {!isGerenteNegocio && (
          <>
            <button
              onClick={() => setActiveTab("empresa")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "empresa"
                  ? "border-[#00CF7B] text-[#00CF7B]"
                  : "border-transparent text-[#00441F] font-semibold hover:text-gray-800"
              }`}
            >
              Dados da Empresa
            </button>
          </>
        )}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 md:p-8 shadow-sm">
        {activeTab === "perfil" && (
          <form onSubmit={handleSavePerfil} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-mail (Leitura)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full border border-gray-200 bg-gray-50 text-[#00441F] font-semibold rounded-lg px-4 py-2 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={telefoneUsuario}
                onChange={(e) => setTelefoneUsuario(formatPhone(e.target.value))}
                maxLength={15}
                placeholder="(11) 99999-9999"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
              />
            </div>
            <button
              type="submit"
              disabled={loadingPerfil}
              className="mt-4 px-6 py-2.5 bg-[#00CF7B] text-white text-sm font-bold rounded-xl hover:bg-[#FF7A40] transition-colors disabled:opacity-50"
            >
              {loadingPerfil ? "Salvando..." : "Salvar Perfil"}
            </button>
          </form>
        )}

        {activeTab === "empresa" && !isGerenteNegocio && (
          <form onSubmit={handleSaveEmpresa} className="space-y-8 max-w-2xl">
            {/* INFORMAÇÕES PRINCIPAIS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Informações Principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome Fantasia da Empresa</label>
                  <input
                    type="text"
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Razão Social</label>
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpjEmpresa}
                    onChange={(e) => setCnpjEmpresa(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">E-mail de Contato (Comercial)</label>
                  <input
                    type="email"
                    value={emailContato}
                    onChange={(e) => setEmailContato(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone da Empresa</label>
                  <input
                    type="text"
                    value={telefoneEmpresa}
                    onChange={(e) => setTelefoneEmpresa(formatPhone(e.target.value))}
                    maxLength={15}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Logotipo da Empresa (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                  {uploadingLogo && <p className="text-xs text-[#00CF7B] mt-1 font-semibold">Fazendo upload...</p>}
                  {!uploadingLogo && <p className="text-[10px] text-[#00441F] font-semibold mt-1">Selecione uma imagem do seu computador para o logotipo.</p>}
                </div>
                {logoUrl && (
                  <div className="md:col-span-2 p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center relative">
                    <img src={logoUrl} alt="Logo Preview" className="max-h-16 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="text-[10px] text-[#00441F] font-semibold mt-2 bg-[#e9ebe4] px-2 py-0.5 rounded border">Logo atual salva</span>
                  </div>
                )}
              </div>
            </div>

            {/* ENDEREÇO */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Endereço (Rua/Avenida)</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]/50"
                  />
                </div>
              </div>
            </div>            
            <button
              type="submit"
              disabled={loadingEmpresa}
              className="mt-4 px-6 py-2.5 bg-[#00CF7B] text-white text-sm font-bold rounded-xl hover:bg-[#FF7A40] transition-colors disabled:opacity-50"
            >
              {loadingEmpresa ? "Salvando..." : "Salvar Dados da Empresa"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
