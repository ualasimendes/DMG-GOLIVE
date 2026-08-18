import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowRight,
  Tv,
  Users,
  ShieldCheck,
  Zap,
  Volume2,
  Lock,
  FolderGit2,
  ExternalLink,
  ShieldAlert,
  LogIn,
  Radio,
  Gamepad2,
  Crown,
  Sparkles,
  Flame,
  Clock,
} from 'lucide-react';
import { AuthUser, PublicRoomInfo, CommunityTopUser } from '../types';
import { WalaceLogo } from './WalaceLogo';
import { getApiBaseUrl } from '../utils/api';

interface LandingViewProps {
  currentUser: AuthUser | null;
  onOpenCreateModal: () => void;
  onJoinRoom: (roomId: string) => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenTermsModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  currentUser,
  onOpenCreateModal,
  onJoinRoom,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenTermsModal,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoomInfo[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const isLoggedIn = !!currentUser;

  // Poll active public rooms every 3.5s
  useEffect(() => {
    let isMounted = true;
    const fetchRooms = () => {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/rooms`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data && Array.isArray(data.rooms)) {
            setPublicRooms(data.rooms);
            setLoadingRooms(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingRooms(false);
        });
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  // 1-Click Join Handler for public rooms
  const handleQuickJoin = (roomId: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    onJoinRoom(roomId);
  };

  return (
    <div className="relative min-h-screen bg-[#07080f] text-zinc-100 flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden font-sans select-none">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-indigo-900/10 blur-[110px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <WalaceLogo size="md" showText={true} />

        <div className="flex items-center gap-3">
          {/* Google Auth / Profile Button */}
          {!currentUser ? (
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
              <span>Fazer Login com Google</span>
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

      {/* Main Container */}
      <main className="w-full max-w-4xl my-auto z-10 flex flex-col items-center text-center py-6 space-y-6">
        {/* Emblem & Branding */}
        <div className="flex flex-col items-center">
          <WalaceLogo size="lg" className="mb-4" />
          <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase font-mono mb-1">
            DMG LIVE SHARE
          </h2>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
            Compartilhe sua gameplay e assista juntos.
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 font-sans max-w-md leading-relaxed">
            Transmissão de tela em tempo real em 1080p 60 FPS com áudio estéreo e moderação de salas para a galera.
          </p>
        </div>

        {/* Safety Guidelines Banner */}
        <div className="w-full max-w-xl bg-red-950/30 border border-red-900/60 rounded-2xl p-3.5 text-left flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 flex-1">
            <div className="font-bold text-red-300 flex items-center justify-between">
              <span>Diretrizes de Segurança & Moderação</span>
              <button
                type="button"
                onClick={onOpenTermsModal}
                className="text-[11px] text-red-400 underline hover:text-red-200 cursor-pointer"
              >
                Ver Regras
              </button>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              É terminantemente proibido conteúdo sexual, violência ou discurso de ódio. Use <code>!help</code> no chat para comandos de moderação e música.
            </p>
          </div>
        </div>

        {/* Action Center Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-5 text-left">
          {/* Left Column: Create Room & Enter Code (5 cols) */}
          <div className="md:col-span-5 bg-[#0d0f19] border border-[#1e2336] rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
            <div>
              {/* User Status Bar */}
              <div className="flex items-center justify-between bg-[#131624] p-3 rounded-xl border border-[#22283e] mb-4">
                {currentUser ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-indigo-500 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow shrink-0"
                        style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                      >
                        {(currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 truncate">
                        <span>{currentUser.displayName || currentUser.username}</span>
                        <span className="text-[10px] text-emerald-400 font-normal shrink-0">● Online</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {currentUser.email || 'Conta Google'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-zinc-300">
                        Não conectado
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Faça login para criar sua sala
                      </div>
                    </div>
                  </div>
                )}

                {!currentUser ? (
                  <button
                    onClick={onOpenAuthModal}
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Entrar</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenProfileModal}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 font-medium transition-colors cursor-pointer shrink-0"
                  >
                    Meu Perfil
                  </button>
                )}
              </div>

              {/* Primary Action Button: Create Room */}
              <button
                id="btn-landing-create-room"
                onClick={handleCreateClick}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Criar Minha Sala</span>
              </button>
            </div>

            <div>
              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-zinc-800 flex-1" />
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                  ou entrar por link/código
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
                  placeholder="Ex: dmg-premium"
                  className="flex-1 bg-[#141724] border border-[#22283c] rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <button
                  id="btn-landing-join-room"
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="px-3.5 py-2 bg-[#171a2b] hover:bg-[#1f233a] border border-[#29304e] text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Public Rooms List (7 cols) */}
          <div className="md:col-span-7 bg-[#0d0f19] border border-[#1e2336] rounded-2xl p-5 shadow-2xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#1b2034] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    Salas Públicas Ao Vivo
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {publicRooms.length} {publicRooms.length === 1 ? 'sala ativa' : 'salas ativas'}
                </span>
              </div>

              {/* Public Rooms Grid / List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                {publicRooms.map((room) => {
                  const isPremium = room.isPermanent || room.id === 'dmg-premium';

                  return (
                    <div
                      key={room.id}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 transition-all border ${
                        isPremium
                          ? 'bg-gradient-to-r from-purple-950/40 via-[#18122a] to-[#121626] border-purple-500/50 hover:border-purple-400 shadow-lg shadow-purple-950/30'
                          : 'bg-[#131626] hover:bg-[#181c30] border-[#212740] hover:border-indigo-500/50'
                      }`}
                    >
                      {/* Room & Host Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Host Avatar with Crown */}
                        <div className="relative shrink-0">
                          {isPremium ? (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white text-sm font-black shadow-md border border-purple-300">
                              👑
                            </div>
                          ) : room.host?.avatar ? (
                            <img
                              src={room.host.avatar}
                              alt={room.host.name}
                              className="w-9 h-9 rounded-full object-cover border border-indigo-500 bg-zinc-800"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                              style={{ backgroundColor: room.host?.avatarColor || '#6366f1' }}
                            >
                              {(room.host?.name || 'Gamer').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {!isPremium && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black rounded-full flex items-center justify-center text-[10px] shadow"
                              title={`Dono da Sala: ${room.host?.name || 'Anfitrião'}`}
                            >
                              👑
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-xs truncate font-mono ${isPremium ? 'text-purple-200 flex items-center gap-1' : 'text-zinc-100'}`}>
                              {isPremium && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
                              <span>{room.name || room.id}</span>
                            </span>

                            {isPremium ? (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-bold tracking-wider uppercase shrink-0">
                                OFICIAL 24/7
                              </span>
                            ) : room.streamingCount > 0 ? (
                              <span className="px-1.5 py-0.2 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-bold tracking-wider uppercase shrink-0">
                                ● AO VIVO
                              </span>
                            ) : null}
                          </div>

                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5 truncate">
                            <span>
                              {isPremium ? 'Sala Oficial da Comunidade' : `Dono: ${room.host?.name || 'Anfitrião'}`}
                            </span>
                            <span>•</span>
                            {room.emptyCountdownSecs !== null && room.emptyCountdownSecs !== undefined && room.userCount === 0 ? (
                              <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Fechando em {room.emptyCountdownSecs}s</span>
                              </span>
                            ) : (
                              <span className="text-indigo-300 font-medium">
                                👥 {room.userCount} {room.userCount === 1 ? 'pessoa' : 'pessoas'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Join Button */}
                      <button
                        onClick={() => handleQuickJoin(room.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
                          isPremium
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        }`}
                        title={`Entrar com 1 clique em ${room.name}`}
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Live Stats Footer */}
            <div className="pt-2 border-t border-[#1b2034] flex items-center justify-between text-[11px] text-zinc-500">
              <span>Transmissão WebRTC P2P de Baixa Latência</span>
              <span className="text-emerald-400 font-mono">● Sistema Online</span>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-4xl">
          <div className="bg-[#0e101c] border border-[#1b2034] rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <Tv className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-bold text-zinc-200">1080p 60 FPS</span>
            <span className="text-[10px] text-zinc-400">Qualidade nativa</span>
          </div>

          <div className="bg-[#0e101c] border border-[#1b2034] rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold text-zinc-200">Som Estéreo & DJ</span>
            <span className="text-[10px] text-zinc-400">YouTube DJ Bot (!playmusic)</span>
          </div>

          <div className="bg-[#0e101c] border border-[#1b2034] rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-zinc-200">Moderação Total</span>
            <span className="text-[10px] text-zinc-400">Comandos !help</span>
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
