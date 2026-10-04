import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import EquipeClient from './EquipeClient';

export default async function EquipePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Apenas cargos de gestão e master têm acesso à tela de Equipe
  if (user.role === 'ponto_venda') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Busca primária (pode vir a tabela toda se o RLS não bloquear)
  const { data: todosUsuarios, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('role', { ascending: true });

  if (error) {
    console.error('Erro ao buscar equipe:', error);
  }

  // Filtro Top-Down: Garantir que o usuário só enxergue a si mesmo e sua estrutura abaixo
  let usuariosFiltrados = todosUsuarios || [];
  
  if (user.role !== 'master' && user.role !== 'diretoria' && user.role !== 'platform_admin') {
    // Função recursiva para buscar toda a cadeia de subordinados (para baixo)
    const getDescendants = (parentId: string, allUsers: any[]): any[] => {
      const children = allUsers.filter(u => u.supervisor_id === parentId);
      let descendants = [...children];
      for (const child of children) {
        descendants = descendants.concat(getDescendants(child.id, allUsers));
      }
      return descendants;
    };

    // Função recursiva para buscar a cadeia de chefia direta (para cima)
    const getAncestors = (userId: string, allUsers: any[]): any[] => {
      const userNode = allUsers.find(u => u.id === userId);
      if (userNode && userNode.supervisor_id) {
        const parent = allUsers.find(u => u.id === userNode.supervisor_id);
        if (parent) {
          return [parent, ...getAncestors(parent.id, allUsers)];
        }
      }
      return [];
    };

    const myDescendants = getDescendants(user.id, usuariosFiltrados);
    const myAncestors = getAncestors(user.id, usuariosFiltrados);
    const currentUserNode = usuariosFiltrados.find(u => u.id === user.id);
    
    // Juntar tudo e remover possíveis duplicatas (garantia)
    const uniqueUsersMap = new Map();
    if (currentUserNode) uniqueUsersMap.set(currentUserNode.id, currentUserNode);
    myDescendants.forEach(u => uniqueUsersMap.set(u.id, u));
    myAncestors.forEach(u => uniqueUsersMap.set(u.id, u));
    
    usuariosFiltrados = Array.from(uniqueUsersMap.values());
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Minha Equipe</h1>
        <p className="mt-2 text-sm text-gray-600">
          Visualização da hierarquia e estrutura do time de vendas.
        </p>
      </div>

      <EquipeClient usuarios={usuariosFiltrados} currentUser={user} />
    </div>
  );
}
