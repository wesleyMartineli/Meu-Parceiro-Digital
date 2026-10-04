'use client';

import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface PreviewModalProps {
  material: any | null;
  onClose: () => void;
}

export default function PreviewModal({ material, onClose }: PreviewModalProps) {
  if (!material) return null;

  const isImage = material.arquivo_tipo.startsWith('image/');
  const isVideo = material.arquivo_tipo.startsWith('video/');
  const isPdf = material.arquivo_tipo === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col relative h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-900">{material.titulo}</h2>
            <p className="text-sm text-gray-500">
              {material.categoria || 'Geral'} • {(material.tamanho_bytes / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={material.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir em Nova Aba
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100 relative rounded-b-2xl">
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img 
                src={material.arquivo_url} 
                alt={material.titulo} 
                className="max-w-full max-h-full object-contain drop-shadow-md"
              />
            </div>
          )}

          {isVideo && (
            <div className="w-full h-full flex items-center justify-center p-4 bg-black">
              <video 
                src={material.arquivo_url} 
                controls 
                className="max-w-full max-h-full"
              />
            </div>
          )}

          {isPdf && (
            <iframe 
              src={`${material.arquivo_url}#toolbar=0`} 
              className="w-full h-full border-0"
              title={material.titulo}
            />
          )}

          {!isImage && !isVideo && !isPdf && (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
              <p className="font-medium text-lg mb-2">Pré-visualização indisponível</p>
              <p className="text-sm">Por favor, faça o download ou abra em uma nova aba para visualizar este formato.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
