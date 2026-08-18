import React, { useState } from 'react';
import {
  Plus,
  ArrowRight,
  Tv,
  Users,
  ShieldCheck,
  Zap,
  Volume2,
  Lock,
  Sparkles,
  FolderGit2,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AuthUser } from '../types';
import { WalaceLogo } from './WalaceLogo';

interface LandingViewProps {
  currentUser: AuthUser;
  onOpenCreateModal: () => void;
  onJoinRoom: (roomId: string) => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenTermsModal: () => void;
  recentRooms: { id: string; name: string }[];
}

export const LandingView: React.FC<LandingViewProps> = ({
  currentUser,
  onOpenCreateModal,
  onJoinRoom,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenTermsModal,
  recentRooms,
}) => {
  const [joinCode, setJoinCode] = useState('');

  const isLoggedIn = !currentUser.isGuest;

  const handleCreateClick = () => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    onOpenCreateModal();
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    onJoinRoom(joinCode.trim());
  };

  const handleRecentRoomClick = (roomId: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    onJoinRoom(roomId);
  };

  return (
    <div className="relative min-h-screen bg-[#07080f] text-zinc-100 flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden font-sans select-none">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-indigo-900/10 blur-[110px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <WalaceLogo size="md" showText={true} />

        <div className="flex items-center gap-3">
          {/* Main Portfolio / Aba Projetos Link */}
          <a
            href="https://walacemendes.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121420] hover:bg-[#1a1d2e] border border-[#21263c] text-xs font-semibold text-zinc-300 hover:text-white transition-all shadow-sm group"
            title="Voltar ao Portfólio Principal"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Aba Projetos</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          {/* Google Auth / Profile Button */}
          {!isLoggedIn ? (
            <button
              onClick={onOpenAuthModal}
              id="btn-landing-login-google"
              className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-900 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-white/10 transition-all active:scale-95 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Entrar com Google</span>
            </button>
          ) : (
            <button
              onClick={onOpenProfileModal}
              id="btn-landing-profile"
              className="flex items-center gap-2 bg-[#121522] hover:bg-[#1a1e30] border border-[#21273d] text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-5 h-5 rounded-full object-cover border border-indigo-500"
                />
              ) : (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                >
                  {(currentUser.displayName || currentUser.username).slice(0, 1).toUpperCase()}
                </div>
              )}
              <span>{currentUser.displayName || currentUser.username}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Box */}
      <main className="w-full max-w-md my-auto z-10 flex flex-col items-center text-center py-6">
        {/* Emblem & Branding */}
        <div className="mb-5 flex flex-col items-center">
          <WalaceLogo size="lg" className="mb-4" />
          <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase font-mono mb-1">
            DMG LIVE SHARE
          </h2>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
            Compartilhe sua gameplay.
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 font-sans max-w-sm leading-relaxed">
            Transmissão de tela em tempo real em 1080p 60 FPS com áudio estéreo cristalino para você e seus amigos.
          </p>
        </div>

        {/* Safety & Anti-abuse Guidelines Alert */}
        <div className="w-full bg-red-950/30 border border-red-900/60 rounded-2xl p-3.5 mb-4 text-left flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-red-300 flex items-center justify-between">
              <span>Diretrizes de Segurança & Convivência</span>
              <button
                type="button"
                onClick={onOpenTermsModal}
                className="text-[11px] text-red-400 underline hover:text-red-200 cursor-pointer"
              >
                Ver Regras
              </button>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              É terminantemente proibido conteúdo sexual, violência, ódio, infrações aos direitos humanos ou atos sem escrúpulos. Violações acarretam em <strong>banimento permanente</strong>.
            </p>
          </div>
        </div>

        {/* Action Card */}
        <div className="w-full bg-[#0d0f19] border border-[#1e2336] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
          {/* User Status Bar */}
          <div className="flex items-center justify-between bg-[#131624] p-3 rounded-xl border border-[#22283e]">
            <div className="flex items-center gap-2.5">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-indigo-500"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                  style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                >
                  {(currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>{currentUser.displayName || currentUser.username}</span>
                  {isLoggedIn && (
                    <span className="text-[10px] text-emerald-400 font-normal">● Verificado</span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {isLoggedIn ? (currentUser.email || 'Conta Google') : 'Faça login para criar salas'}
                </div>
              </div>
            </div>

            {!isLoggedIn ? (
              <button
                onClick={onOpenAuthModal}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
              >
                Fazer Login
              </button>
            ) : (
              <button
                onClick={onOpenProfileModal}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 font-medium transition-colors cursor-pointer"
              >
                Editar
              </button>
            )}
          </div>

          {/* Primary Action Button: Create Room */}
          <button
            id="btn-landing-create-room"
            onClick={handleCreateClick}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Criar Nova Sala</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
              ou entrar por código
            </span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          {/* Join by Code Form */}
          <form onSubmit={handleJoinSubmit} className="flex gap-2">
            <input
              id="input-landing-room-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Digite o código da sala..."
              className="flex-1 bg-[#141724] border border-[#22283c] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              id="btn-landing-join-room"
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-2.5 bg-[#171a2b] hover:bg-[#1f233a] border border-[#29304e] text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Entrar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Recent Rooms */}
          {recentRooms.length > 0 && (
            <div className="pt-2 text-left space-y-1.5">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Salas Recentes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentRooms.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRecentRoomClick(r.id)}
                    className="px-2.5 py-1 bg-[#141726] hover:bg-[#1c2035] border border-[#22283e] text-indigo-300 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                  >
                    #{r.name || r.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mt-5">
          <div className="bg-[#0e101c] border border-[#1b2034] rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <Tv className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-bold text-zinc-200">1080p 60 FPS</span>
            <span className="text-[10px] text-zinc-400">Qualidade nativa</span>
          </div>

          <div className="bg-[#0e101c] border border-[#1b2034] rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold text-zinc-200">Som Estéreo</span>
            <span className="text-[10px] text-zinc-400">Áudio do jogo</span>
          </div>

          <div className="bg-[#0e101c] border border-[#1b2034] rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-zinc-200">Sem Delay</span>
            <span className="text-[10px] text-zinc-400">WebRTC P2P</span>
          </div>
        </div>
      </main>

      {/* Production Clean Footer */}
      <footer className="w-full max-w-5xl z-10 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 border-t border-zinc-900">
        <div className="flex items-center gap-2">
          <span>Walace Mendes © 2026</span>
          <span>•</span>
          <span>Todos os direitos reservados</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenTermsModal}
            className="hover:text-zinc-200 transition-colors cursor-pointer underline flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Diretrizes da Comunidade & Termos de Uso</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
