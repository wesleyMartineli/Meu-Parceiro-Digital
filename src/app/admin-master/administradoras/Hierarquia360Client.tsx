'use client';

import React, { useMemo, useTransition } from 'react';
import { impersonateUserAction } from '@/modules/auth/actions';
import { Network, Search, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

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

export default function Hierarquia360Client({ usuarios, currentUser }: { usuarios: User[], currentUser: any }) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [collapsedNodes, setCollapsedNodes] = React.useState<Record<string, boolean>>({});

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
        alert(result.message);
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
        roots.push(nodeMap[u.id]);
      }
    });

    return roots;
  }, [usuarios]);

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'diretoria':
      case 'master':
      case 'platform_admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'superintendente':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'regional':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'gerente_negocio':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master': return 'Master';
      case 'platform_admin': return 'SysAdmin';
      case 'diretoria': return 'Diretoria';
      case 'superintendente': return 'Superintendente';
      case 'regional': return 'Regional Com.';
      case 'gerente_negocio': return 'Gerente Neg.';
      default: return 'Usuário';
    }
  };

  const renderNode = (node: any) => {
    const isCurrentUser = node.id === currentUser.id;
    const isMatch = searchTerm && node.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const currentUserWeight = ROLE_WEIGHTS[currentUser.role] || 0;
    const nodeWeight = ROLE_WEIGHTS[node.role] || 0;
    const canImpersonate = !isCurrentUser && (currentUserWeight > nodeWeight || currentUser.role === 'master' || currentUser.role === 'platform_admin');

    return (
      <div className="flex flex-col items-center">
        {/* Node Card */}
        <div className={`relative bg-[#1E293B] border ${isMatch ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : isCurrentUser ? 'border-[#00CF7B]' : 'border-slate-700'} rounded-xl p-4 w-[220px] md:w-[260px] flex flex-col items-center text-center transition-all hover:border-slate-500 z-10`}>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border mb-3 ${getRoleStyle(node.role)}`}>
            {node.nome[0].toUpperCase()}
          </div>
          
          <h3 className="text-sm font-bold text-white leading-tight w-full truncate" title={node.nome}>
            {node.nome}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 mb-2 truncate w-full" title={node.email}>{node.email}</p>
          
          <div className="flex flex-wrap justify-center gap-1 mb-3">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleStyle(node.role)}`}>
              {getRoleLabel(node.role)}
            </span>
            {!node.ativo && (
              <span className="text-[9px] uppercase tracking-wider font-bold bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded-full">
                Inativo
              </span>
            )}
            {isCurrentUser && (
              <span className="text-[9px] uppercase tracking-wider font-bold bg-[#00CF7B]/20 text-[#00CF7B] border border-[#00CF7B]/30 px-2 py-0.5 rounded-full">
                Você
              </span>
            )}
          </div>

          {canImpersonate && (
             <button
                onClick={() => handleImpersonate(node.id)}
                disabled={isPending}
                className="w-full text-[11px] font-bold py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-[#00CF7B] hover:text-white hover:border-[#00CF7B] transition-all disabled:opacity-50"
             >
               {isPending ? 'Conectando...' : 'Acessar Perfil'}
             </button>
          )}

          {/* Expand/Collapse Button */}
          {node.children && node.children.length > 0 && (
            <button
              onClick={() => toggleNode(node.id)}
              className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-[#0B0F19] border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 rounded-full p-1 z-20 transition-all shadow-md"
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
      <div className="flex justify-center gap-6">
        {nodes.map((node, i) => {
          const hasChildren = node.children && node.children.length > 0;

          return (
            <div key={node.id} className="flex flex-col items-center relative">
              {renderNode(node)}

              {hasChildren && !collapsedNodes[node.id] && (
                <div className="flex flex-col items-center mt-0">
                  {/* Vertical line down from parent */}
                  <div className="w-px h-8 bg-slate-700"></div>

                  <div className="relative flex justify-center">
                    <div className="flex gap-6 justify-center">
                      {node.children.map((child: any, idx: number) => {
                        const isChildFirst = idx === 0;
                        const isChildLast = idx === node.children.length - 1;
                        const isChildOnly = node.children.length === 1;
                        
                        return (
                          <div key={child.id} className="flex flex-col items-center relative pt-8">
                            {/* Horizontal connection lines spanning across children */}
                            {!isChildOnly && (
                              <div className="absolute top-0 w-full flex">
                                <div className={`w-1/2 h-px ${isChildFirst ? 'bg-transparent' : 'bg-slate-700'}`}></div>
                                <div className={`w-1/2 h-px ${isChildLast ? 'bg-transparent' : 'bg-slate-700'}`}></div>
                              </div>
                            )}

                            {/* Vertical line connecting horizontal bar down to child */}
                            <div className="absolute top-0 w-px h-8 bg-slate-700"></div>

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
    <div className="max-w-7xl mx-auto space-y-6 text-slate-100 pb-20">
      <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-400" />
            Hierarquia 360 Graus
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Visão completa do organograma da plataforma. Como usuário Master, você pode visualizar e auditar (Acessar Perfil) a conta de qualquer colaborador presente na estrutura.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar pelo nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#0B0F19] border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white w-full sm:w-64 transition-all"
            />
          </div>
          <div className="bg-[#0B0F19] px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3 whitespace-nowrap">
            <div>
              <p className="text-lg font-black text-white leading-none">{usuarios.length}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Usuários Ativos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#0B0F19] border border-slate-800 rounded-3xl p-8 custom-scrollbar text-center">
        <div className="min-w-max inline-block min-h-[60vh] text-left">
          {usuarios.length > 0 ? (
            renderTree(tree)
          ) : (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
               <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
               <p className="text-slate-400 font-medium">Nenhum usuário encontrado na hierarquia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
