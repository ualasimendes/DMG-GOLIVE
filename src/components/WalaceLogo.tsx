import React from 'react';
import { Radio } from 'lucide-react';

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
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-13 h-13 text-base',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Sleek Diamond-Glass Emblem */}
      <div
        className={`${sizeClasses[size]} relative rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-indigo-700 p-[1.5px] shadow-lg shadow-indigo-500/20 flex items-center justify-center group shrink-0 transition-transform duration-200 group-hover:scale-105`}
      >
        <div className="w-full h-full bg-[#0a0c14] rounded-[14px] flex items-center justify-center overflow-hidden transition-colors group-hover:bg-[#0f1320] relative">
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-violet-300 tracking-tighter font-mono group-hover:scale-105 transition-transform">
            DMG
          </span>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-sm tracking-tight text-white">
              DMG <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">LIVE SHARE</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[9px] font-bold tracking-widest uppercase font-mono">
              60 FPS
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono tracking-tight">
            live.walacemendes.com.br
          </span>
        </div>
      )}
    </div>
  );
};
