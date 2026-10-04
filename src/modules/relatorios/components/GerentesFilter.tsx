'use client';

import React from 'react';

interface GerentesFilterProps {
  gerentes: { id: string; nome: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function GerentesFilter({ gerentes, selectedIds, onChange }: GerentesFilterProps) {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(val => val !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === gerentes.length) {
      onChange([]); // deselect all
    } else {
      onChange(gerentes.map(v => v.id)); // select all
    }
  };

  return (
    <div className="bg-[#e9ebe4] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Filtro por Gerentes</h3>
        <button
          onClick={handleSelectAll}
          className="text-sm font-semibold text-[#00CF7B] hover:text-[#FF7A40] transition-colors"
        >
          {selectedIds.length === gerentes.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {gerentes.map((gerente) => {
          const isSelected = selectedIds.includes(gerente.id);
          return (
            <button
              key={gerente.id}
              onClick={() => handleToggle(gerente.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                isSelected
                  ? 'bg-gradient-to-r from-[#00441F] to-[#00CF7B] text-white border-transparent shadow-md shadow-emerald-500/20'
                  : 'bg-gray-50 text-[#00441F] font-semibold border-gray-200 hover:border-[#00CF7B] hover:bg-[#e9ebe4]'
              }`}
            >
              {gerente.nome}
            </button>
          );
        })}
        {gerentes.length === 0 && (
          <p className="text-sm text-[#00441F] font-semibold">Nenhum gerente encontrado.</p>
        )}
      </div>
    </div>
  );
}

