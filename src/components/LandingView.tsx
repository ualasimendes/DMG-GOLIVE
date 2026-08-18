import React, { useState } from 'react';
import { WalaceLogo } from './WalaceLogo';
import { Play, Plus, ArrowRight, Gamepad2, Shield, Zap, User, LogIn, Sparkles } from 'lucide-react';
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

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDomainGuide}
            className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#121420] hover:bg-[#1a1d2e] border border-[#21263c] font-mono text-xs text-indigo-300 transition-colors"
          >
            live.walacemendes.com
          </button>

          {/* User Profile / Auth Button */}
          {currentUser.isGuest ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar / Cadastrar</span>
            </button>
          ) : (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 bg-[#121522] hover:bg-[#1a1e30] border border-[#21273d] text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
              >
                {(currentUser.displayName || currentUser.username).slice(0, 1).toUpperCase()}
              </div>
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
            WALACE SHARE
          </h2>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
            Compartilhe sua gameplay.
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 font-sans max-w-sm leading-relaxed">
            Crie uma sala e compartilhe sua tela com seus amigos em 1080p 60 FPS com áudio do jogo.
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
          Walace Share © 2026 • Hospedado em <span className="text-zinc-400 font-mono">live.walacemendes.com</span>
        </div>
        <button
          onClick={onOpenDomainGuide}
          className="font-mono text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Guia de Deploy & DNS ➔
        </button>
      </footer>
    </div>
  );
};
