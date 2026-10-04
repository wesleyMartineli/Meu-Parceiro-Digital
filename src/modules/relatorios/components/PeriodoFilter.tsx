'use client';

import React from 'react';

interface PeriodoFilterProps {
  selectedMonth: string;
  selectedYear: string;
  onChange: (month: string, year: string) => void;
}

const MESES = [
  { value: 'all', label: 'Todos os Meses' },
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' }
];

export default function PeriodoFilter({ selectedMonth, selectedYear, onChange }: PeriodoFilterProps) {
  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const anos = ['all'];
  for (let y = startYear; y <= currentYear; y++) {
    anos.push(y.toString());
  }

  return (
    <div className="bg-[#e9ebe4] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Filtro por Período</h3>
        <button
          onClick={() => onChange('all', 'all')}
          className="text-sm font-semibold text-[#00CF7B] hover:text-[#FF7A40] transition-colors"
        >
          Limpar Filtro
        </button>
      </div>
      
      <div className="flex flex-col gap-5">
        {/* Filtro de Ano */}
        <div>
          <label className="text-sm font-semibold text-[#00441F] font-semibold mb-2 block uppercase tracking-wider">Ano</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onChange(selectedMonth, 'all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                selectedYear === 'all'
                  ? 'bg-gradient-to-r from-[#00441F] to-[#00CF7B] text-white border-transparent shadow-md shadow-emerald-500/20'
                  : 'bg-gray-50 text-[#00441F] font-semibold border-gray-200 hover:border-[#00CF7B] hover:bg-[#e9ebe4]'
              }`}
            >
              Todos os Anos
            </button>
            {anos.filter(a => a !== 'all').map(ano => (
              <button
                key={ano}
                onClick={() => onChange(selectedMonth, ano)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  selectedYear === ano
                    ? 'bg-gradient-to-r from-[#00441F] to-[#00CF7B] text-white border-transparent shadow-md shadow-emerald-500/20'
                    : 'bg-gray-50 text-[#00441F] font-semibold border-gray-200 hover:border-[#00CF7B] hover:bg-[#e9ebe4]'
                }`}
              >
                {ano}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro de Mês */}
        <div className={selectedYear === 'all' ? 'opacity-50 pointer-events-none' : ''}>
          <label className="text-sm font-semibold text-[#00441F] font-semibold mb-2 block uppercase tracking-wider">Mês</label>
          <div className="flex flex-wrap gap-2">
            {MESES.map(mes => (
              <button
                key={mes.value}
                onClick={() => onChange(mes.value, selectedYear)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  selectedMonth === mes.value
                    ? 'bg-gradient-to-r from-[#00441F] to-[#00CF7B] text-white border-transparent shadow-md shadow-emerald-500/20'
                    : 'bg-gray-50 text-[#00441F] font-semibold border-gray-200 hover:border-[#00CF7B] hover:bg-[#e9ebe4]'
                }`}
              >
                {mes.value === 'all' ? 'Todos' : MESES.find(m => m.value === mes.value)?.label.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

