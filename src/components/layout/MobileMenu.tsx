'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MobileMenu({ children, variant = 'light' }: { children: React.ReactNode, variant?: 'light' | 'dark' }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Fechar o menu ao mudar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isDark = variant === 'dark';
  
  const bgClass = isDark ? 'bg-[#00441F]' : 'bg-[#dddedc]';
  const textClass = isDark ? 'text-white' : 'text-[#00441F] font-semibold';
  const iconClass = isDark ? 'text-slate-300 hover:text-white' : 'text-[#00441F] font-semibold hover:text-gray-900';
  const overlayClass = isDark ? 'bg-black/80' : 'bg-black/50';

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 -ml-2 focus:outline-none ${iconClass}`}
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className={`fixed inset-0 transition-opacity ${overlayClass}`}
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className={`relative flex w-full max-w-[280px] flex-col overflow-y-auto ${bgClass} shadow-xl h-full`}>
            <div className="absolute top-0 right-0 pt-4 pr-4 z-50">
              <button
                type="button"
                className={`flex items-center justify-center h-10 w-10 rounded-full focus:outline-none ${iconClass}`}
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className={`flex-1 flex flex-col ${textClass}`}>
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
