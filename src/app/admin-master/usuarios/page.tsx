import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import UsuariosClient from './UsuariosClient';

export default async function AdminUsuariosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'master' && user.role !== 'platform_admin') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Busca todos os usuários com o relacionamento da empresa
  const { data: usuarios, error: userError } = await supabase
    .from('usuarios')
    .select(`
      id,
      nome,
      email,
      role,
      ativo,
      supervisor_id
    `)
    .order('nome', { ascending: true });

  if (userError) {
    console.error('Erro ao buscar usuários global:', userError);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <UsuariosClient
        usuarios={(usuarios as any) || []}
      />
    </div>
  );
}
