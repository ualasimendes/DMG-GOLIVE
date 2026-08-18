import React, { useState } from 'react';
import { WalaceLogo } from './WalaceLogo';
import { Play, Plus, ArrowRight, Gamepad2, Shield, Zap, User, LogIn, Sparkles, FolderGit2, Globe, ExternalLink } from 'lucide-react';
import { AuthUser } from '../types';

interface LandingViewProps {
  currentUser: AuthUser;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenCreateModal: () => void;
  onJoinRoomByCode: (code: string) => void;
  onOpenDomainGuide: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  currentUser,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenCreateModal,
  onJoinRoomByCode,
  onOpenDomainGuide,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Digite o código ou nome da sala');
      return;
    }
    setError('');
    onJoinRoomByCode(roomCode.trim());
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100 flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden select-none font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-violet-600/20 to-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-indigo-900/15 blur-[110px] pointer-events-none" />

      {/* Top Simple Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <WalaceLogo size="md" showText={true} />

        <div className="flex items-center gap-2.5">
          {/* Main Site / Projetos Link */}
          <a
            href="https://walacemendes.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121420] hover:bg-[#1a1d2e] border border-[#21263c] text-xs font-semibold text-zinc-300 hover:text-white transition-all shadow-sm group"
            title="Voltar ao Portfólio / Aba Projetos"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Aba Projetos</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          {/* DNS / Domain Guide */}
          <button
            onClick={onOpenDomainGuide}
            className="hidden md:inline-block px-3 py-1.5 rounded-xl bg-[#121420] hover:bg-[#1a1d2e] border border-[#21263c] font-mono text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            live.walacemendes.com.br
          </button>

          {/* User Profile / Google Auth Button */}
          {currentUser.isGuest ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-900 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-white/10 transition-all active:scale-95"
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
              className="flex items-center gap-2 bg-[#121522] hover:bg-[#1a1e30] border border-[#21273d] text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-5 h-5 rounded-full object-cover"
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
        {/* Project Breadcrumb Indicator */}
        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/60 text-[11px] text-indigo-300 font-medium">
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Projeto Integrado ao portfólio <strong>walacemendes.com.br</strong></span>
        </div>

        {/* Emblem & Branding */}
        <div className="mb-5 flex flex-col items-center">
          <WalaceLogo size="lg" className="mb-4" />
          <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase font-mono mb-1">
            DMG LIVE SHARE (DMG-GOLIVE)
          </h2>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
            Compartilhe sua gameplay.
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 font-sans max-w-sm leading-relaxed">
            Alternativa ao Discord Go Live para assistir jogos e filmes com áudio estéreo em 1080p 60 FPS.
          </p>
        </div>

        {/* Action Card */}
        <div className="w-full bg-[#0d0f19] border border-[#1e2336] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
          {/* User Welcome info */}
          <div className="flex items-center justify-between bg-[#131624] p-3 rounded-xl border border-[#22283e]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
              >
                {(currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-100">
                  {currentUser.displayName || currentUser.username}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {currentUser.isGuest ? 'Modo Convidado' : `@${currentUser.username}`}
                </div>
              </div>
            </div>

            <button
              onClick={currentUser.isGuest ? onOpenAuthModal : onOpenProfileModal}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              {currentUser.isGuest ? 'Fazer Login' : 'Editar Perfil'}
            </button>
          </div>

          {/* Action 1: CRIAR SALA */}
          <button
            id="btn-landing-create-room"
            onClick={onOpenCreateModal}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>CRIAR SALA</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="w-full h-[1px] bg-[#1d2234]" />
            <span className="absolute px-3 bg-[#0d0f19] text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              ou
            </span>
          </div>

          {/* Action 2: ENTRAR EM UMA SALA */}
          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <div className="text-left space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Código ou nome da sala</label>
              <div className="flex gap-2">
                <input
                  id="input-landing-room-code"
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ex: gameplay, cs2-squad"
                  className="flex-1 bg-[#131624] border border-[#22283e] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <button
                  type="submit"
                  id="btn-landing-join-room"
                  className="px-4 py-2.5 rounded-xl bg-[#171b2c] hover:bg-[#22283e] text-indigo-300 font-bold text-xs uppercase tracking-wider border border-[#29314c] flex items-center gap-1.5 transition-colors"
                >
                  <span>ENTRAR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>
          </form>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-zinc-500 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>P2P Baixa Latência</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>1080p 60 FPS</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Áudio Estéreo</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 py-3 border-t border-[#141724] gap-2 z-10">
        <div>
          Walace Mendes © 2026 • Hospedado em <span className="text-zinc-400 font-mono">live.walacemendes.com.br</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ualasimendes/DMG-GOLIVE"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            GitHub: ualasimendes/DMG-GOLIVE
          </a>
          <span>•</span>
          <button
            onClick={onOpenDomainGuide}
            className="font-mono text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Tutorial DNS & Domínio ➔
          </button>
        </div>
      </footer>
    </div>
  );
};
