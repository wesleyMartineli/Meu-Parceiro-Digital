'use client';

import React, { useMemo, useTransition, useState } from 'react';
import { impersonateUserAction } from '@/modules/auth/actions';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  supervisor_id: string | null;
}

const ROLE_WEIGHTS: Record<string, number> = {
  master: 100,
  platform_admin: 90,
  diretoria: 80,
  superintendente: 70,
  regional: 60,
  gerente_negocio: 50,
  ponto_venda: 40
};

export default function EquipeClient({ usuarios, currentUser }: { usuarios: User[], currentUser: any }) {
  const [isPending, startTransition] = useTransition();
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleImpersonate = (userId: string) => {
    startTransition(async () => {
      const result = await impersonateUserAction(userId);
      if (!result.success) {
        alert(result.message); // Ou usar toast
      }
    });
  };

  // Build the tree
  const tree = useMemo(() => {
    const nodeMap: Record<string, any> = {};
    const roots: any[] = [];

    // Create a node for each user
    usuarios.forEach(u => {
      nodeMap[u.id] = { ...u, children: [] };
    });

    // Populate children
    usuarios.forEach(u => {
      if (u.supervisor_id && nodeMap[u.supervisor_id]) {
        nodeMap[u.supervisor_id].children.push(nodeMap[u.id]);
      } else {
        // Se não tiver supervisor OU o supervisor não estiver na lista (por causa do RLS), ele é raiz para essa visualização
        roots.push(nodeMap[u.id]);
      }
    });

    return roots;
  }, [usuarios]);

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'master':
      case 'platform_admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'diretoria':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'superintendente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'regional':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'gerente_negocio':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master': return 'Master';
      case 'platform_admin': return 'Administrador';
      case 'diretoria': return 'Diretoria';
      case 'superintendente': return 'Superintendente';
      case 'regional': return 'Regional Comercial';
      case 'gerente_negocio': return 'Gerente de Negócios';
      default: return 'Ponto de Venda';
    }
  };

  const renderNode = (node: any) => {
    const isCurrentUser = node.id === currentUser.id;
    
    const currentUserWeight = ROLE_WEIGHTS[currentUser.role] || 0;
    const nodeWeight = ROLE_WEIGHTS[node.role] || 0;
    const canImpersonate = !isCurrentUser && (currentUserWeight > nodeWeight || currentUser.role === 'master' || currentUser.role === 'platform_admin');

    return (
      <div className="flex flex-col items-center">
        {/* Node Card */}
        <div className={`relative bg-white border ${isCurrentUser ? 'border-[#00CF7B] shadow-md' : 'border-gray-200 shadow-sm'} rounded-xl p-4 w-[220px] md:w-[260px] flex flex-col items-center text-center transition-all hover:shadow-lg hover:border-gray-300 z-10`}>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border mb-3 ${getRoleStyle(node.role)}`}>
            {node.nome[0].toUpperCase()}
          </div>
          
          <h3 className="text-sm font-bold text-gray-900 leading-tight w-full truncate" title={node.nome}>
            {node.nome}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1 mb-2 truncate w-full" title={node.email}>{node.email}</p>
          
          <div className="flex flex-wrap justify-center gap-1 mb-3">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleStyle(node.role)}`}>
              {getRoleLabel(node.role)}
            </span>
            {!node.ativo && (
              <span className="text-[9px] uppercase tracking-wider font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                Inativo
              </span>
            )}
            {isCurrentUser && (
              <span className="text-[9px] uppercase tracking-wider font-bold bg-[#00441F] text-white px-2 py-0.5 rounded-full">
                Você
              </span>
            )}
          </div>

          {canImpersonate && (
             <button
                onClick={() => handleImpersonate(node.id)}
                disabled={isPending}
                className="w-full text-[11px] font-bold py-1.5 px-3 rounded-lg border border-gray-200 bg-gray-50 text-[#00441F] hover:bg-[#00CF7B] hover:text-white hover:border-[#00CF7B] transition-colors disabled:opacity-50"
             >
               {isPending ? 'Carregando...' : 'Acessar Perfil'}
             </button>
          )}

          {/* Expand/Collapse Button */}
          {node.children && node.children.length > 0 && (
            <button
              onClick={() => toggleNode(node.id)}
              className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 rounded-full p-1 z-20 transition-all shadow-sm"
              title={collapsedNodes[node.id] ? "Expandir Equipe" : "Ocultar Equipe"}
            >
              {collapsedNodes[node.id] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTree = (nodes: any[]) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className="flex justify-center gap-4">
        {nodes.map((node, i) => {
          const hasChildren = node.children && node.children.length > 0;

          return (
            <div key={node.id} className="flex flex-col items-center relative">
              {renderNode(node)}

              {hasChildren && !collapsedNodes[node.id] && (
                <div className="flex flex-col items-center mt-0">
                  {/* Vertical line down from parent */}
                  <div className="w-px h-6 bg-gray-300"></div>

                  <div className="relative flex justify-center">
                    <div className="flex gap-4 justify-center">
                      {node.children.map((child: any, idx: number) => {
                        const isChildFirst = idx === 0;
                        const isChildLast = idx === node.children.length - 1;
                        const isChildOnly = node.children.length === 1;
                        
                        return (
                          <div key={child.id} className="flex flex-col items-center relative pt-6">
                            {/* Horizontal connection lines spanning across children */}
                            {!isChildOnly && (
                              <div className="absolute top-0 w-full flex">
                                <div className={`w-1/2 h-px ${isChildFirst ? 'bg-transparent' : 'bg-gray-300'}`}></div>
                                <div className={`w-1/2 h-px ${isChildLast ? 'bg-transparent' : 'bg-gray-300'}`}></div>
                              </div>
                            )}

                            {/* Vertical line connecting horizontal bar down to child */}
                            <div className="absolute top-0 w-px h-6 bg-gray-300"></div>

                            {renderTree([child])}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Visão Geral da Equipe</h2>
          <p className="text-sm text-gray-500">
            Organograma visual da sua hierarquia comercial. Você pode visualizar e acessar as contas de seus subordinados diretamente por aqui.
          </p>
        </div>
        <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 flex items-center gap-3">
           <svg className="w-5 h-5 text-[#00CF7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
           <div>
             <p className="text-xl font-black text-[#00441F] leading-none">{usuarios.length > 0 ? usuarios.length - 1 : 0}</p>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Membros Subordinados</p>
           </div>
        </div>
      </div>

      <div className="pt-8 pb-16 overflow-x-auto text-center">
        <div className="min-w-max px-8 inline-block text-left">
          {usuarios.length > 0 ? (
            renderTree(tree)
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed w-full max-w-3xl mx-auto">
               <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhuma equipe encontrada</h3>
               <p className="mt-1 text-sm text-gray-500">Você não possui subordinados registrados sob a sua gestão no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
