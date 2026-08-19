import React from 'react';
import { Eye, Tv, Users, ArrowRight, X, Shield } from 'lucide-react';

interface JoinChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomId: string;
  onSelectWatchOnly: () => void;
  onSelectStream: () => void;
}

export const JoinChoiceModal: React.FC<JoinChoiceModalProps> = ({
  isOpen,
  onClose,
  roomName,
  roomId,
  onSelectWatchOnly,
  onSelectStream,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans">
      <div
        id="modal-join-choice"
        className="w-full max-w-lg bg-[#0c0e17] border border-[#1e2338] rounded-3xl p-6 sm:p-8 shadow-2xl relative text-zinc-100 space-y-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Room Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Entrando na Sala</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {roomName || roomId}
          </h2>
          <p className="text-xs text-zinc-400">
            Como você gostaria de entrar nesta sessão?
          </p>
        </div>

        {/* Options Cards */}
        <div className="grid grid-cols-1 gap-3.5">
          {/* Option 1: Watch & Talk (Recommended) */}
          <button
            type="button"
            onClick={onSelectWatchOnly}
            className="w-full p-4 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/30 to-[#121524] hover:border-indigo-400 hover:from-indigo-900/40 transition-all text-left group cursor-pointer shadow-lg shadow-indigo-600/10 flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-200">
                  Assistir e Conversar
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Entre como espectador para acompanhar a transmissão, falar por voz e participar do chat.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform self-center" />
          </button>

          {/* Option 2: Stream screen */}
          <button
            type="button"
            onClick={onSelectStream}
            className="w-full p-4 rounded-2xl border border-[#1e243a] bg-[#101322] hover:border-[#2b3350] hover:bg-[#15192c] transition-all text-left group cursor-pointer flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white">
                  Transmitir Minha Tela
                </h4>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Streamer
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Você poderá escolher a resolução (720p/1080p/2K/4K a 60 FPS) e transmitir sua tela com som estéreo.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all self-center" />
          </button>
        </div>

        {/* Security / Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 text-center pt-1">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          <span>Você pode ligar ou desligar o microfone e a transmissão a qualquer momento.</span>
        </div>
      </div>
    </div>
  );
};
