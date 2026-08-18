import React from 'react';

interface WalaceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const WalaceLogo: React.FC<WalaceLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Geometric 'DMG' Emblem with modern violet/electric styling */}
      <div
        className={`${sizeClasses[size]} relative rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-[1px] shadow-lg shadow-indigo-900/30 flex items-center justify-center group shrink-0`}
      >
        <div className="w-full h-full bg-[#0e1017] rounded-[11px] flex items-center justify-center overflow-hidden transition-colors group-hover:bg-[#121520]">
          <span className="font-extrabold text-indigo-400 tracking-tighter text-xs font-mono group-hover:text-indigo-300 transition-transform group-hover:scale-105">
            DMG
          </span>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-sm tracking-wider text-zinc-100 uppercase font-sans">
            DMG <span className="text-indigo-400">LIVE SHARE</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono tracking-tight -mt-0.5">
            live.walacemendes.com.br
          </span>
        </div>
      )}
    </div>
  );
};
