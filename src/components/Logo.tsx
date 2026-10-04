import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  variant?: 'light' | 'dark';
  showText?: boolean;
}

export default function Logo({
  className = '',
  size = 'md',
  variant = 'dark',
  showText = true,
}: LogoProps) {
  const sizing = {
    sm: {
      height: 'h-8 sm:h-9',
      maxWidth: 'max-w-full',
    },
    md: {
      height: 'h-10 sm:h-12',
      maxWidth: 'max-w-full',
    },
    lg: {
      height: 'h-14 sm:h-16',
      maxWidth: 'max-w-full',
    },
    xl: {
      height: 'h-16 sm:h-24 lg:h-[120px]',
      maxWidth: 'max-w-full sm:max-w-[600px]',
    },
    xxl: {
      height: 'h-24 sm:h-32 lg:h-[180px]',
      maxWidth: 'max-w-full sm:max-w-[800px]',
    },
  };

  const { height, maxWidth } = sizing[size];

  if (showText) {
    // Use transparent logo for both variants (works on light and dark backgrounds)
    const src = '/brand/meu-parceiro-digital-logo-transparente.png';
      
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src={src} 
          alt="Meu Parceiro Digital | Rodobens" 
          className={`${height} ${maxWidth} w-auto object-contain flex-shrink-0 transition-all`}
        />
      </div>
    );
  } else {
    // Icon only - "P" symbol
    const src = '/brand/meu-parceiro-digital-icon.png';

    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src={src} 
          alt="Meu Parceiro Digital" 
          className={`${height} w-auto object-contain rounded-full flex-shrink-0 transition-all`}
        />
      </div>
    );
  }
}
