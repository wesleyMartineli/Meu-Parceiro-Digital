import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { signOut } from '@/modules/auth/actions';
import AdminSidebarLinks from '@/components/layout/AdminSidebarLinks';
import Logo from '@/components/Logo';
import MobileMenu from '@/components/layout/MobileMenu';

export default async function AdminMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'master' && user.role !== 'platform_admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden text-slate-100 font-sans">
      {/* Sidebar - Fixada na esquerda com tema escuro */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-800 bg-[#0B0F19] h-full z-20">
        {/* Logo / Brand */}
        <div className="flex min-h-24 lg:min-h-[140px] flex-col gap-2 items-center justify-center p-4 border-b border-slate-800">
          <Logo size="xl" variant="light" className="justify-center w-full" />
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/50 text-red-400 font-semibold border border-red-900/30 w-fit">
            MASTER
          </span>
        </div>

        {/* Links do Menu */}
        <AdminSidebarLinks />

        {/* Rodapé da Sidebar / Perfil do Admin */}
        <div className="p-4 border-t border-slate-800 bg-[#090C15]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user.nome}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider">
                PLATFORM ADMIN
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#0F172A] min-w-0">
        {/* Header Superior */}
        <header className="h-20 sm:h-28 md:h-16 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between px-6 z-50 relative">
          {/* Logo Mobile (Oculto em telas médias/grandes) */}
          <div className="flex items-center gap-2 md:hidden">
            <MobileMenu variant="dark">
              <div className="flex min-h-24 flex-col gap-2 items-center justify-center p-4 border-b border-slate-800">
                <Logo size="xl" variant="light" className="justify-center w-full" />
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/50 text-red-400 font-semibold border border-red-900/30 w-fit">
                  MASTER
                </span>
              </div>
              <AdminSidebarLinks />
            </MobileMenu>
            <Logo size="xl" variant="light" className="justify-center" />
          </div>

          <div>
            <span className="text-xs text-slate-500 font-medium">Console Geral de Administração</span>
          </div>

          {/* Perfil e Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none mb-1">{user.nome}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {user.email}
              </p>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-400 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all cursor-pointer"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Corpo do Conteúdo - Scrollável */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
