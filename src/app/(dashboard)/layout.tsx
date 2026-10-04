import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from '@/lib/supabase/helpers';
import { signOut } from '@/modules/auth/actions';
import SidebarLinks from '@/components/layout/SidebarLinks';
import Logo from '@/components/Logo';
import LegalFooter from '@/components/layout/LegalFooter';
import ImpersonationBanner from '@/components/layout/ImpersonationBanner';
import { AlertCircle } from 'lucide-react';
import MobileMenu from '@/components/layout/MobileMenu';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const company = await getActiveCompany();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#E0E5CF]">
      {user.is_impersonating && (
        <ImpersonationBanner impersonatedName={user.nome} />
      )}
      
      {company?.status_pagamento === 'atrasado' && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 relative z-50">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            Atenção: Identificamos uma pendência financeira na sua assinatura. 
            Para evitar o bloqueio da conta, por favor, regularize sua situação o quanto antes ou contate o suporte.
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden text-[#00441F]">
      {/* Sidebar - Fixada na esquerda */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-[#E0E5CF] bg-[#dddedc] h-full z-20">
        {/* Logo / Brand */}
        <div className="flex flex-col min-h-24 lg:min-h-[140px] items-center justify-center p-4 border-b border-[#E0E5CF] gap-4">
          <Logo size="xl" variant="dark" className="justify-center w-full" />
          {company?.logo_url && (
            <div className="w-full max-w-[140px] flex justify-center">
              <img src={company.logo_url} alt={`Logo ${company.nome_empresa}`} className="max-h-16 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          )}
        </div>

        {/* Links do Menu */}
        <SidebarLinks role={user.role} />

        {/* Rodapé da Sidebar / Empresa */}
        <div className="p-4 border-t border-[#E0E5CF] bg-[#dddedc]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#00441F]/10 to-[#00CF7B]/10 flex items-center justify-center font-bold text-[#00441F] text-sm">
              {user.nome ? user.nome[0].toUpperCase() : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#00441F] truncate">
                {user.nome || 'Gerente'}
              </p>
              <p className="text-[10px] text-[#00441F] font-semibold font-medium truncate uppercase tracking-wider">
                {user.role === 'superintendente' ? 'Gerente / Admin' : 'Gerente de Negócios'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
        {/* Header Superior */}
        <header className="h-20 sm:h-28 md:h-16 border-b border-[#E0E5CF] bg-[#e9ebe4] flex items-center justify-between px-6 z-50 relative">
          {/* Logo Mobile (Oculto em telas médias/grandes) */}
          <div className="flex items-center gap-2 md:hidden">
            <MobileMenu>
              <div className="flex flex-col min-h-24 items-center justify-center p-4 border-b border-[#E0E5CF] gap-4">
                <Logo size="xl" variant="dark" className="justify-center w-full" />
              </div>
              <SidebarLinks role={user.role} />
            </MobileMenu>
            <Logo size="xl" variant="dark" />
            {company?.logo_url && (
              <>
                <span className="text-gray-300">|</span>
                <img src={company.logo_url} alt="Logo" className="max-h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              </>
            )}
          </div>

          <div className="hidden md:block">
            {/* Espaço reservado para breadcrumbs ou títulos dinâmicos */}
            <span className="text-xs text-[#00441F] font-semibold font-medium">Meu Parceiro Digital</span>
          </div>

          {/* Dados do Usuário e Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#00441F] leading-none mb-1">{user.nome}</p>
              <p className="text-[10px] text-[#00441F] font-semibold font-medium uppercase tracking-wider">
                {user.email}
              </p>
            </div>

            {/* Avatar do Usuário */}
            <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-semibold text-[#00441F] font-semibold text-sm border border-gray-300">
              {user.nome?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className="h-5 w-px bg-gray-200" />

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition-all cursor-pointer"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Corpo do Conteúdo - Scrollável */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#e9ebe4] flex flex-col min-w-0">
          <div className="flex-1 p-6 md:p-8 min-w-0">
            {children}
          </div>
          <LegalFooter />
        </main>
      </div>
      </div>
    </div>
  );
}
