'use client';

import React, { useState, useTransition } from 'react';
import { createCampanhaAction, toggleCampanhaStatusAction, deleteCampanhaAction } from '@/modules/campanhas/actions';

function formatDate(dateString: string) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default function CampanhasClient({ campanhas }: { campanhas: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [nome, setNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [segmentos, setSegmentos] = useState<string[]>([]);
  const [descTaxaAdm, setDescTaxaAdm] = useState(0);
  const [descPriParcela, setDescPriParcela] = useState(0);
  const [redMeiaQtd, setRedMeiaQtd] = useState(0);
  const [feedback, setFeedback] = useState<{success: boolean, message: string} | null>(null);

  const toggleSegmento = (seg: string) => {
    if (segmentos.includes(seg)) {
      setSegmentos(segmentos.filter(s => s !== seg));
    } else {
      setSegmentos([...segmentos, seg]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('data_inicio', dataInicio);
      formData.append('data_fim', dataFim);
      segmentos.forEach(s => formData.append('segmentos', s));
      formData.append('desconto_taxa_adm', String(descTaxaAdm));
      formData.append('desconto_primeira_parcela', String(descPriParcela));
      formData.append('reducao_meia_parcela_qtd', String(redMeiaQtd));

      const res = await createCampanhaAction({ success: false, message: null }, formData);
      setFeedback({ success: res.success, message: res.message || '' });
      
      if (res.success) {
        setTimeout(() => {
          setIsModalOpen(false);
          setNome(''); setDataInicio(''); setDataFim(''); setSegmentos([]); setDescTaxaAdm(0); setDescPriParcela(0); setRedMeiaQtd(0);
        }, 1500);
      }
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleCampanhaStatusAction(id, currentStatus);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) {
      startTransition(async () => {
        await deleteCampanhaAction(id);
      });
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00CF7B] text-[#00441F] font-bold py-2.5 px-6 rounded-xl hover:bg-[#00E588] transition-colors shadow-lg shadow-[#00CF7B]/20"
        >
          + Nova Campanha
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-4">Campanha</th>
                <th className="px-6 py-4">Benefícios Matemáticos</th>
                <th className="px-6 py-4">Período de Validade</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {campanhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma campanha cadastrada.
                  </td>
                </tr>
              )}
              {campanhas.map((campanha) => (
                <tr key={campanha.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white mb-1">{campanha.nome}</div>
                    <div className="flex gap-1">
                      {campanha.segmentos.map((seg: string) => (
                         <span key={seg} className="bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded text-slate-400 uppercase tracking-wider">
                           {seg}
                         </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs space-y-1">
                    {campanha.desconto_taxa_adm > 0 && <div>- {campanha.desconto_taxa_adm}% Taxa ADM</div>}
                    {campanha.desconto_primeira_parcela > 0 && <div>- {campanha.desconto_primeira_parcela}% 1ª Parcela</div>}
                    {campanha.reducao_meia_parcela_qtd > 0 && <div>Meia Parcela ({campanha.reducao_meia_parcela_qtd}m)</div>}
                    {campanha.desconto_taxa_adm === 0 && campanha.desconto_primeira_parcela === 0 && campanha.reducao_meia_parcela_qtd === 0 && (
                      <span className="text-slate-500">Nenhum</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {campanha.data_inicio && campanha.data_fim 
                      ? `${formatDate(campanha.data_inicio)} até ${formatDate(campanha.data_fim)}` 
                      : 'Sem validade'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggle(campanha.id, campanha.status)}
                      disabled={isPending}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${campanha.status ? 'bg-[#00CF7B]' : 'bg-slate-700'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${campanha.status ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(campanha.id)}
                      disabled={isPending}
                      className="text-red-400 hover:text-red-300 font-bold text-xs bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Criar Nova Campanha</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nome da Campanha</label>
                    <input 
                      type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CF7B]"
                      placeholder="Ex: Feirão Imóvel 2026"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Inicial</label>
                      <input 
                        type="date" required value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CF7B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Final</label>
                      <input 
                        type="date" required value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CF7B]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Segmentos Válidos</label>
                  <div className="flex gap-2">
                    {['imovel', 'auto', 'pesado', 'moto', 'servico'].map(seg => (
                      <button
                        key={seg} type="button" onClick={() => toggleSegmento(seg)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          segmentos.includes(seg) 
                            ? 'bg-[#00CF7B]/20 border-[#00CF7B] text-[#00CF7B]' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {seg.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-white mb-4">Benefícios Matemáticos no Simulador</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Desconto Taxa ADM (%)</label>
                      <input 
                        type="number" step="0.1" min="0" value={descTaxaAdm} onChange={(e) => setDescTaxaAdm(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CF7B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Desconto 1ª Parcela (%)</label>
                      <input 
                        type="number" step="1" min="0" max="100" value={descPriParcela} onChange={(e) => setDescPriParcela(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CF7B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Qtd Meses Meia Parcela</label>
                      <input 
                        type="number" step="1" min="0" value={redMeiaQtd} onChange={(e) => setRedMeiaQtd(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CF7B]"
                        placeholder="Ex: 6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {feedback && (
                <div className={`mt-6 p-3 rounded-xl text-xs font-bold ${feedback.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {feedback.message}
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="bg-[#00CF7B] text-[#00441F] font-bold py-2.5 px-6 rounded-xl hover:bg-[#00E588] transition-colors shadow-lg shadow-[#00CF7B]/20 disabled:opacity-50">
                  {isPending ? 'Salvando...' : 'Salvar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
