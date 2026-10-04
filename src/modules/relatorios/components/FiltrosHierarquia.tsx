'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, CheckSquare, Square } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  role: string;
  supervisor_id: string | null;
}

interface FiltrosHierarquiaProps {
  usuarios: Usuario[];
  currentUserRole: string;
  currentUserId: string;
  onGerentesChange: (gerentesIds: string[]) => void;
}

export default function FiltrosHierarquia({ usuarios, currentUserRole, currentUserId, onGerentesChange }: FiltrosHierarquiaProps) {
  const [selectedSuper, setSelectedSuper] = useState<string>('all');
  const [selectedRegional, setSelectedRegional] = useState<string>('all');
  const [selectedGerentes, setSelectedGerentes] = useState<string[]>([]);
  const [isGerentesOpen, setIsGerentesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGerentesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Determinar o acesso base (Quais nós da árvore o usuário enxerga)
  const accessibleUsers = useMemo(() => {
    if (currentUserRole === 'master' || currentUserRole === 'diretoria' || currentUserRole === 'platform_admin') {
      return usuarios;
    }

    // Se for superintendente, pega ele, os regionais dele, e os gerentes dos regionais dele
    if (currentUserRole === 'superintendente') {
      const regionaisIds = usuarios.filter(u => u.supervisor_id === currentUserId).map(u => u.id);
      return usuarios.filter(u => 
        u.id === currentUserId || 
        u.supervisor_id === currentUserId || 
        (u.supervisor_id && regionaisIds.includes(u.supervisor_id))
      );
    }

    // Se for regional, pega ele e os gerentes dele
    if (currentUserRole === 'regional') {
      return usuarios.filter(u => 
        u.id === currentUserId || 
        u.supervisor_id === currentUserId
      );
    }

    // Gerente ou outros
    return usuarios.filter(u => u.id === currentUserId);
  }, [usuarios, currentUserRole, currentUserId]);

  const supersDisponiveis = useMemo(() => accessibleUsers.filter(u => u.role === 'superintendente'), [accessibleUsers]);
  
  const regionaisDisponiveis = useMemo(() => {
    let list = accessibleUsers.filter(u => u.role === 'regional');
    if (selectedSuper !== 'all') {
      list = list.filter(u => u.supervisor_id === selectedSuper);
    }
    return list;
  }, [accessibleUsers, selectedSuper]);

  const gerentesDisponiveis = useMemo(() => {
    let list = accessibleUsers.filter(u => u.role === 'gerente_negocio');
    
    // Se selecionou regional, filtra por ele
    if (selectedRegional !== 'all') {
      list = list.filter(u => u.supervisor_id === selectedRegional);
    } 
    // Se não selecionou regional, mas selecionou super, filtra pelos gerentes que estão abaixo dos regionais desse super
    else if (selectedSuper !== 'all') {
      const regionaisDoSuper = accessibleUsers.filter(u => u.supervisor_id === selectedSuper).map(r => r.id);
      list = list.filter(u => u.supervisor_id && regionaisDoSuper.includes(u.supervisor_id));
    }
    return list;
  }, [accessibleUsers, selectedRegional, selectedSuper]);

  // Se trocar o super, reseta regional e gerentes
  const handleSuperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSuper(e.target.value);
    setSelectedRegional('all');
    // Não precisa resetar selectedGerentes se quisermos que ele auto-filtre, mas é melhor garantir que todos da nova lista sejam selecionados
  };

  const handleRegionalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegional(e.target.value);
  };

  // Quando a lista de gerentes disponíveis muda (devido a mudança nos selects acima), selecionamos todos por padrão
  useEffect(() => {
    const todosIds = gerentesDisponiveis.map(g => g.id);
    setSelectedGerentes(todosIds);
    onGerentesChange(todosIds);
  }, [gerentesDisponiveis]);

  const handleToggleGerente = (id: string) => {
    let newSelected;
    if (selectedGerentes.includes(id)) {
      newSelected = selectedGerentes.filter(val => val !== id);
    } else {
      newSelected = [...selectedGerentes, id];
    }
    setSelectedGerentes(newSelected);
    onGerentesChange(newSelected);
  };

  const handleSelectAllGerentes = () => {
    if (selectedGerentes.length === gerentesDisponiveis.length) {
      setSelectedGerentes([]);
      onGerentesChange([]);
    } else {
      const todosIds = gerentesDisponiveis.map(g => g.id);
      setSelectedGerentes(todosIds);
      onGerentesChange(todosIds);
    }
  };

  const showSuperFilter = currentUserRole === 'master' || currentUserRole === 'diretoria' || currentUserRole === 'platform_admin';
  const showRegionalFilter = showSuperFilter || currentUserRole === 'superintendente';

  return (
    <div className="bg-[#e9ebe4] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8 flex flex-col gap-6">
      
      {/* Top row: Selects */}
      {(showSuperFilter || showRegionalFilter) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showSuperFilter && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Superintendente</label>
              <select 
                value={selectedSuper}
                onChange={handleSuperChange}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00CF7B] text-gray-800"
              >
                <option value="all">Todos os Superintendentes</option>
                {supersDisponiveis.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
          )}

          {showRegionalFilter && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Regional Comercial</label>
              <select 
                value={selectedRegional}
                onChange={handleRegionalChange}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00CF7B] text-gray-800"
              >
                <option value="all">Todos os Regionais</option>
                {regionaisDisponiveis.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Bottom row: Multi-select Gerentes */}
      <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
        <label className="text-sm font-bold text-gray-700">Gerentes de Negócios</label>
        <button
          type="button"
          onClick={() => setIsGerentesOpen(!isGerentesOpen)}
          className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00CF7B] text-gray-800"
        >
          <span className="truncate">
            {selectedGerentes.length === gerentesDisponiveis.length && gerentesDisponiveis.length > 0
              ? 'Todos os Gerentes Selecionados'
              : selectedGerentes.length === 0
              ? 'Nenhum Gerente Selecionado'
              : `${selectedGerentes.length} Gerentes Selecionados`}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isGerentesOpen ? 'rotate-180' : ''}`} />
        </button>

        {isGerentesOpen && (
          <div className="absolute top-[70px] left-0 w-full z-10 bg-white border border-gray-200 shadow-xl rounded-xl max-h-64 overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-100 p-2 flex justify-between items-center z-20">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Selecionar Múltiplos</span>
              <button
                type="button"
                onClick={handleSelectAllGerentes}
                className="text-xs font-bold text-[#00CF7B] hover:text-[#FF7A40] transition-colors px-2"
              >
                {selectedGerentes.length === gerentesDisponiveis.length && gerentesDisponiveis.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
            
            <div className="p-2 flex flex-col">
              {gerentesDisponiveis.map((gerente) => {
                const isSelected = selectedGerentes.includes(gerente.id);
                return (
                  <label
                    key={gerente.id}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 group"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleGerente(gerente.id)}
                      className="w-4 h-4 text-[#00CF7B] border-gray-300 rounded focus:ring-[#00CF7B] hidden"
                    />
                    <div className="text-[#00CF7B]">
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-[#00441F]' : 'text-gray-700'}`}>
                      {gerente.nome}
                    </span>
                  </label>
                );
              })}
              {gerentesDisponiveis.length === 0 && (
                <p className="text-sm text-gray-500 italic p-4 text-center">Nenhum gerente encontrado neste filtro.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
