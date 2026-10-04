'use client';

import React, { useState } from 'react';
import { Search, Loader2, MapPin, Star, Link as LinkIcon, Building2, AlertCircle, Download, Plus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createLeadAction } from '@/modules/crm/actions';

interface ProspectarClientProps {
  userId: string;
  empresaId: string;
}

interface LeadResult {
  nome: string;
  telefone: string;
  site: string;
  rating: string;
  reviews: string;
  endereco: string;
  categoria: string;
  status: string;
  motivo: string;
  prioridade: number;
  ano_site: number;
  email: string;
  wa_numero: string;
  ig_link: string;
}

export default function ProspectarClient({ userId, empresaId }: ProspectarClientProps) {
  const [nicho, setNicho] = useState('');
  const [regiao, setRegiao] = useState('');
  const [maxResults, setMaxResults] = useState<string | number>(50);
  const [minRating, setMinRating] = useState<string | number>(3.5);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<LeadResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [mapeados, setMapeados] = useState<Set<number>>(new Set());
  const [mapping, setMapping] = useState<Set<number>>(new Set());
  const API_URL = process.env.NEXT_PUBLIC_PROSPECTA_API_URL || 'http://localhost:8000/api/scrape';

  const handleMapLead = async (lead: LeadResult, index: number) => {
    setMapping(prev => new Set(prev).add(index));
    try {
      const formData = new FormData();
      formData.append('nome', lead.nome);
      formData.append('telefone', lead.telefone || '');
      formData.append('email', lead.email || '');
      formData.append('tipo_parceiro', 'lead');
      formData.append('etapa_funil', 'mapeado');
      formData.append('origem', 'Prospecção Automática');
      
      let observacoes = `Endereço: ${lead.endereco || '-'}\n`;
      observacoes += `Categoria: ${lead.categoria || '-'}\n`;
      if (lead.site) observacoes += `Site: ${lead.site}\n`;
      if (lead.rating) observacoes += `Google Rating: ${lead.rating} (${lead.reviews} reviews)\n`;
      if (lead.wa_numero) observacoes += `WhatsApp ID: ${lead.wa_numero}\n`;
      if (lead.ig_link) observacoes += `Instagram: ${lead.ig_link}\n`;
      
      formData.append('observacoes', observacoes);
      formData.append('nome_responsavel', '');
      formData.append('codigo_pv', '');
      formData.append('cidade', '');
      formData.append('estado', '');
      
      const res = await createLeadAction({ success: false, message: null }, formData);
      
      if (res.success) {
        toast.success(`${lead.nome} foi mapeado com sucesso!`);
        setMapeados(prev => new Set(prev).add(index));
      } else {
        toast.error(`Erro ao mapear: ${res.message}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro ao mapear o lead.');
    } finally {
      setMapping(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleSearch = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    toast('Iniciando busca...', { icon: '🔍' });
    
    if (!nicho.trim() || !regiao.trim()) {
      toast.error('Por favor, preencha o nicho e a região');
      return;
    }

    const query = `${nicho} ${regiao}`;

    setLoading(true);
    setHasSearched(false);
    setErrorMsg('');
    setResults([]);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          max_results: Number(maxResults),
          min_rating: Number(minRating),
          headless: false
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o motor de busca.');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setHasSearched(true);

      if (data.leads && data.leads.length > 0) {
        setResults(data.leads);
        toast.success(`${data.leads.length} parceiros encontrados!`);
      } else {
        toast('Nenhum parceiro encontrado com esses critérios.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro inesperado ao buscar parceiros.');
      toast.error('Erro na prospecção. Verifique se o motor Python está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;

    const headers = [
      'Nome', 'Telefone', 'Email', 'Site', 'Avaliação', 'Reviews', 'Endereço', 'Categoria', 'Status Site', 'Prioridade', 'WhatsApp', 'Instagram'
    ];
    
    const csvRows = results.map(lead => {
      return [
        `"${(lead.nome || '').replace(/"/g, '""')}"`,
        `"${(lead.telefone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.site || '').replace(/"/g, '""')}"`,
        `"${(lead.rating || '').replace(/"/g, '""')}"`,
        `"${(lead.reviews || '').replace(/"/g, '""')}"`,
        `"${(lead.endereco || '').replace(/"/g, '""')}"`,
        `"${(lead.categoria || '').replace(/"/g, '""')}"`,
        `"${(lead.status || '').replace(/"/g, '""')}"`,
        `"${(lead.prioridade || '').toString()}"`,
        `"${(lead.wa_numero || '').replace(/"/g, '""')}"`,
        `"${(lead.ig_link || '').replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...csvRows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prospeccao_${nicho.replace(/\s+/g, '_')}_${regiao.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SITE_OK':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Site OK</span>;
      case 'SEM_SITE':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">Sem Site</span>;
      case 'SITE_RUIM':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">Site Ruim</span>;
      case 'SITE_QUEBRADO':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Quebrado</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Search className="w-8 h-8 text-[#00441F]" />
            Prospecção Automática
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Busque novos parceiros no Google Maps em tempo real
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nicho</label>
            <input
              type="text"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              placeholder="Ex: contabilidade"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00441F] focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex-1 w-full min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Região</label>
            <input
              type="text"
              value={regiao}
              onChange={(e) => setRegiao(e.target.value)}
              placeholder="Ex: Curitiba, PR"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00441F] focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="text"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value.replace(/\D/g, '')))}
              placeholder="50"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00441F] focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota Mínima</label>
            <input
              type="text"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value.replace(',', '.'))}
              placeholder="3.5"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00441F] focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="h-11 px-8 bg-[#00441F] hover:bg-[#003315] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Buscar
              </>
            )}
          </button>
        </div>
        
        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Erro de Conexão</p>
              <p>{errorMsg}</p>
              <p className="text-xs mt-1">Dica: O microserviço Python precisa estar rodando (uvicorn api:app --reload) na porta 8000.</p>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-800">Resultados da Busca ({results.length})</h2>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Avaliação</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Site</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Endereço</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#00441F]/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-[#00441F]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{lead.nome}</p>
                          <p className="text-xs text-gray-500">{lead.categoria || 'Sem categoria'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium text-gray-700">{lead.rating || '-'}</span>
                        <span className="text-xs text-gray-400">({lead.reviews || '0'})</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div>{lead.telefone || '-'}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[150px]">{lead.email || ''}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(lead.status)}
                        {lead.site && (
                          <a href={lead.site} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3" /> Abrir Site
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                        <span className="line-clamp-2 max-w-[200px]">{lead.endereco || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.nome} ${lead.endereco || ''}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold"
                        >
                          <MapPin className="w-4 h-4" />
                          Ver no Maps
                        </a>
                        {mapeados.has(index) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                            <CheckCircle2 className="w-4 h-4" />
                            Mapeado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMapLead(lead, index)}
                            disabled={mapping.has(index)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00441F]/10 hover:bg-[#00441F]/20 text-[#00441F] text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {mapping.has(index) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            {mapping.has(index) ? 'Salvando...' : 'Mapear'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Empty state quando a busca não retorna nenhum resultado */}
      {hasSearched && !loading && results.length === 0 && !errorMsg && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum parceiro encontrado com esses filtros</h3>
          <p className="text-gray-500 mt-2 max-w-md text-sm">
            O Google Maps encontrou locais, mas nenhum atingiu a <strong>Nota Mínima ({minRating})</strong> ou a busca não retornou empresas cadastradas.
          </p>
          <div className="mt-4 flex gap-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span>💡 <strong>Dica:</strong> Experimente colocar a Nota Mínima como <strong>0</strong> para trazer todas as empresas (inclusive as sem avaliação no Maps) ou corrija o nome da cidade/nicho.</span>
          </div>
        </div>
      )}
      
      {/* Loading state animado detalhado */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-100"></div>
            <div className="w-16 h-16 rounded-full border-4 border-[#00441F] border-t-transparent animate-spin absolute top-0 left-0"></div>
            <Search className="w-6 h-6 text-[#00441F] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-6">A Inteligência Artificial está trabalhando...</h3>
          <p className="text-gray-500 mt-2 max-w-md">
            Estamos varrendo o Google Maps, extraindo contatos, acessando os sites para verificar a qualidade e buscando emails. Isso pode levar alguns minutos dependendo da quantidade de resultados.
          </p>
        </div>
      )}
    </div>
  );
}
