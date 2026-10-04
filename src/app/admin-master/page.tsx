import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';

export default async function AdminMasterPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'master' && user.role !== 'platform_admin') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const { count: empresasCount } = await supabase.from('empresas').select('*', { count: 'exact', head: true });
  const { count: usuariosCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
  const { count: simulacoesCount } = await supabase.from('simulacoes').select('*', { count: 'exact', head: true });

  const masterKpis = [
    { label: 'Empresas Cadastradas', value: empresasCount?.toString() || '0', change: 'Total na plataforma', color: 'text-amber-500' },
    { label: 'Total de Usuários', value: usuariosCount?.toString() || '0', change: 'Total na plataforma', color: 'text-blue-400' },
    { label: 'Simulações Globais', value: simulacoesCount?.toString() || '0', change: 'Total na plataforma', color: 'text-emerald-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Mensagem de Boas-Vindas */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-3 shadow-md relative overflow-hidden">
        {/* Glow sutil */}
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#00CF7B]/10 blur-[60px]" />
        
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Painel de Controle <span className="text-[#00CF7B]">Master</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base font-light leading-relaxed">
          Olá, <span className="font-semibold text-slate-200">{user?.nome}</span>. Você está logado no console global da plataforma Meu Parceiro Digital. Use as seções para administrar o ecossistema.
        </p>
      </div>

      {/* Grid de KPIs Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {masterKpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</span>
              <span className="text-xs font-medium text-emerald-400">{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Atalhos Rápidos para Admin */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Administração Global</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin-master/empresas" className="group bg-[#1E293B] border border-slate-800 rounded-xl p-6 hover:border-[#00CF7B] transition-all">
            <h3 className="text-md font-bold text-white group-hover:text-[#00CF7B] transition-colors">
              Empresas / Tenants
            </h3>
            <p className="text-xs text-slate-400 font-light mt-2 leading-relaxed">
              Monitore empresas cadastradas, alterne planos e altere status de suspensão.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00CF7B] mt-4 group-hover:underline">
              Gerenciar Empresas &rarr;
            </span>
          </Link>

          <Link href="/admin-master/usuarios" className="group bg-[#1E293B] border border-slate-800 rounded-xl p-6 hover:border-[#00CF7B] transition-all">
            <h3 className="text-md font-bold text-white group-hover:text-[#00CF7B] transition-colors">
              Usuários do Sistema
            </h3>
            <p className="text-xs text-slate-400 font-light mt-2 leading-relaxed">
              Crie gerentes de empresa, ative/desative contas e liste perfis.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00CF7B] mt-4 group-hover:underline">
              Gerenciar Usuários &rarr;
            </span>
          </Link>

          <Link href="/admin-master/administradoras" className="group bg-[#1E293B] border border-slate-800 rounded-xl p-6 hover:border-[#00CF7B] transition-all">
            <h3 className="text-md font-bold text-white group-hover:text-[#00CF7B] transition-colors">
              Administradoras de Consórcio
            </h3>
            <p className="text-xs text-slate-400 font-light mt-2 leading-relaxed">
              Ative ou desative administradoras nacionais e configure suas chaves de API.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00CF7B] mt-4 group-hover:underline">
              Gerenciar Administradoras &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

