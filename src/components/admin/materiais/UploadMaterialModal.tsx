'use client';

import React, { useState, useRef, useTransition } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadMaterialAction } from '@/modules/admin/materiais-actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadMaterialModal({ isOpen, onClose }: UploadMaterialModalProps) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check size < 50MB
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 50MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 50 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 50MB.');
        return;
      }
      setFile(droppedFile);
    }
  };

  const resetForm = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!file) {
      toast.error('Selecione um arquivo para upload.');
      return;
    }

    startTransition(async () => {
      const result = await uploadMaterialAction({ success: false, message: '' }, formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
        handleClose();
      } else {
        toast.error(result.message || 'Erro ao fazer upload.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-[#0F172A] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-800 flex flex-col relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Novo Material</h2>
            <p className="text-sm text-slate-400 mt-1">Faça upload de um arquivo para os parceiros.</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Título do Material *</label>
              <input
                type="text"
                name="titulo"
                required
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Ex: Manual de Vendas Consórcio Imobiliário"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição (opcional)</label>
              <textarea
                name="descricao"
                rows={3}
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                placeholder="Breve descrição sobre o conteúdo do material..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoria</label>
              <select
                name="categoria"
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="Geral">Geral</option>
                <option value="Treinamentos">Treinamentos</option>
                <option value="Manuais">Manuais</option>
                <option value="Marketing">Marketing (Artes, Banners)</option>
                <option value="Apresentações">Apresentações Comerciais</option>
              </select>
            </div>
          </div>

          <div 
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              file ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 hover:border-slate-500 bg-[#1E293B]'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              name="arquivo"
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden"
            />
            
            {file ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-sm font-medium text-white break-all max-w-[280px]">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="mt-4 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                  Remover e escolher outro
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-slate-400">
                  PDF, Imagens, Vídeos ou Documentos (Max: 50MB)
                </p>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !file}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
