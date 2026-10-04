import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import Hierarquia360Client from './Hierarquia360Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminHierarquiaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'master' && user.role !== 'platform_admin' && user.role !== 'diretoria') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Buscar TODOS os usuários do sistema, ordenados por role (hierarquia) e nome
  const { data: usuariosData } = await supabase
    .from('usuarios')
    .select('id, nome, email, role, ativo, supervisor_id')
    .order('nome', { ascending: true });

  // Como o RLS está sendo usado com Service Role ou o Master tem acesso global?
  // O Master tem permissão global, então ele puxará todos.
  const usuarios = usuariosData || [];

  return (
    <div className="p-2 sm:p-6 min-h-screen">
      <Hierarquia360Client usuarios={usuarios} currentUser={user} />
    </div>
  );
}
