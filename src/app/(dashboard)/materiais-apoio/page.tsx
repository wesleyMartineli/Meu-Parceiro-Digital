'use client';

import React, { useState, useEffect } from 'react';
import { getMateriais } from '@/modules/admin/materiais-actions';
import { FileText, Image as ImageIcon, FileVideo, Download, Search, Loader2, Eye } from 'lucide-react';
import PreviewModal from './PreviewModal';

export default function MateriaisApoioDashboardPage() {
  const [materiais, setMateriais] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);

  useEffect(() => {
    const fetchMateriais = async () => {
      setIsLoading(true);
      const data = await getMateriais();
      setMateriais(data);
      setIsLoading(false);
    };
    fetchMateriais();
  }, []);

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return <FileText className="w-10 h-10 text-[#00441F]/60" />;
    if (tipo.includes('image')) return <ImageIcon className="w-10 h-10 text-[#00441F]/60" />;
    if (tipo.includes('video')) return <FileVideo className="w-10 h-10 text-[#00441F]/60" />;
    return <FileText className="w-10 h-10 text-[#00441F]/60" />;
  };

  const categories = ['Todas', ...Array.from(new Set(materiais.map(m => m.categoria || 'Geral')))];

  const filteredMateriais = materiais.filter(m => {
    const matchesSearch = 
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.descricao && m.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Todas' || (m.categoria || 'Geral') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-[#00441F] tracking-tight">Material de Apoio</h1>
        <p className="text-gray-500 mt-2">
          Acesse arquivos, manuais, treinamentos e artes para apoiar suas vendas.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00CF7B] focus:border-transparent sm:text-sm shadow-sm transition-all"
          />
        </div>
        <div className="flex-shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full sm:w-auto py-3 pl-4 pr-10 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00CF7B] sm:text-sm shadow-sm font-medium"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Materiais */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#00CF7B]" />
          <p className="font-medium">Carregando materiais...</p>
        </div>
      ) : filteredMateriais.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum material encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'Todas'
              ? 'Tente ajustar seus filtros para encontrar o que procura.'
              : 'Ainda não há materiais disponíveis. Eles aparecerão aqui quando a administração fizer os uploads.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMateriais.map((material) => (
            <div 
              key={material.id} 
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              <div className="p-6 flex-1 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                  {getFileIcon(material.arquivo_tipo)}
                </div>
                
                <div className="w-full">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00441F]/5 text-[#00441F] mb-3">
                    {material.categoria || 'Geral'}
                  </span>
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-2 leading-tight">
                    {material.titulo}
                  </h3>
                  {material.descricao && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {material.descricao}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">
                  {(material.tamanho_bytes / (1024 * 1024)).toFixed(1)} MB
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewMaterial(material)}
                    className="flex items-center gap-1.5 text-sm font-bold text-[#00CF7B] hover:text-[#00441F] transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <a
                    href={material.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-bold text-[#00441F] hover:text-[#00CF7B] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Abrir
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PreviewModal 
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />
    </div>
  );
}
