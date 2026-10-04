'use client';

import React, { useState, useEffect } from 'react';
import { getMateriais, deleteMaterialAction } from '@/modules/admin/materiais-actions';
import UploadMaterialModal from '@/components/admin/materiais/UploadMaterialModal';
import { FileText, Image as ImageIcon, FileVideo, Plus, Trash2, Download, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MateriaisApoioPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchMateriais = async () => {
    setIsLoading(true);
    const data = await getMateriais();
    setMateriais(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMateriais();
  }, []);

  // When modal closes, refresh data
  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchMateriais();
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    setIsDeleting(id);
    const result = await deleteMaterialAction(id, fileUrl);
    if (result.success) {
      toast.success(result.message);
      setMateriais(prev => prev.filter(m => m.id !== id));
    } else {
      toast.error(result.message);
    }
    setIsDeleting(null);
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (tipo.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (tipo.includes('video')) return <FileVideo className="w-8 h-8 text-purple-500" />;
    return <FileText className="w-8 h-8 text-slate-400" />;
  };

  const filteredMateriais = materiais.filter(m => 
    m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.descricao && m.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.categoria && m.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Material de Apoio</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie os materiais de suporte que os parceiros e gerentes têm acesso.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Novo Material
        </button>
      </div>

      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título, descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-[#0F172A] text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p>Carregando materiais...</p>
          </div>
        ) : filteredMateriais.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Nenhum material encontrado</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {searchTerm 
                ? 'Sua busca não retornou nenhum resultado. Tente outros termos.'
                : 'Você ainda não fez o upload de nenhum material de apoio.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Arquivo</th>
                  <th className="px-6 py-4 font-medium">Detalhes</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">Tamanho</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMateriais.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(material.arquivo_tipo)}
                        <div>
                          <p className="font-semibold text-white text-sm line-clamp-1">{material.titulo}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{material.arquivo_nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300 max-w-xs line-clamp-2">
                        {material.descricao || '-'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Cadastrado em {new Date(material.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {material.categoria || 'Geral'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400">
                        {(material.tamanho_bytes / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={material.arquivo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Fazer Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDelete(material.id, material.arquivo_url)}
                          disabled={isDeleting === material.id}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          {isDeleting === material.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadMaterialModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
      />
    </div>
  );
}
