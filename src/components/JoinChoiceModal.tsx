import React from 'react';
import { Eye, Tv, Users, ArrowRight, X, Sparkles, Shield } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div
        id="modal-join-choice"
        className="w-full max-w-lg bg-[#0c0e17] border border-[#232a3f] rounded-2xl p-6 sm:p-8 shadow-2xl relative text-zinc-100 space-y-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Room Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Entrando na Sala</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {roomName || roomId}
          </h2>
          <p className="text-xs text-zinc-400">
            Como você deseja participar desta sessão?
          </p>
        </div>

        {/* Options Cards */}
        <div className="grid grid-cols-1 gap-3.5">
          {/* Opção 1: Apenas Assistir (Recomendado) */}
          <button
            type="button"
            onClick={onSelectWatchOnly}
            className="w-full p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 to-[#121522] hover:border-indigo-400 hover:from-indigo-900/40 transition-all text-left group cursor-pointer shadow-lg shadow-indigo-600/10 flex items-start gap-4 relative overflow-hidden"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-100 group-hover:text-white">
                  Apenas Assistir e Conversar
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Entre como espectador para assistir às lives ativas, conversar por voz e interagir no chat.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform self-center" />
          </button>

          {/* Opção 2: Transmitir Tela (Streamer) */}
          <button
            type="button"
            onClick={onSelectStream}
            className="w-full p-4 rounded-xl border border-[#1e2436] bg-[#10131f] hover:border-[#2d364f] hover:bg-[#151928] transition-all text-left group cursor-pointer flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white">
                  Quero Transmitir Minha Tela
                </h4>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                  Streamer
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Você escolherá a resolução (720p/1080p/2K/4K) e transmitirá seu jogo ou filme para a sala.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all self-center" />
          </button>
        </div>

        {/* Security / Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 text-center pt-1">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          <span>Você sempre pode iniciar ou parar de transmitir a qualquer momento na barra inferior.</span>
        </div>
      </div>
    </div>
  );
};
