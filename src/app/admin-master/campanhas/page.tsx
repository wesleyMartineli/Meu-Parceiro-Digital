import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import CampanhasClient from './CampanhasClient';

export default async function CampanhasPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'master' && user.role !== 'platform_admin' && user.role !== 'diretoria')) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const { data: campanhas, error } = await supabase
    .from('campanhas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar campanhas:', error);
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Campanhas Globais</h1>
        <p className="mt-2 text-sm text-gray-400">
          Gerencie promoções, descontos e reduções matemáticas que impactam o simulador de todas as equipes.
        </p>
      </div>

      <CampanhasClient campanhas={campanhas || []} />
    </div>
  );
}
