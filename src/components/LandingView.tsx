import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowRight,
  Tv,
  Users,
  ShieldCheck,
  Volume2,
  Lock,
  LogIn,
  Radio,
  Gamepad2,
  Crown,
  Sparkles,
  Clock,
  ShieldAlert,
  Wifi,
  Headphones,
} from 'lucide-react';
import { AuthUser, PublicRoomInfo } from '../types';
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

  const handleQuickJoin = (roomId: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    onJoinRoom(roomId);
  };

  return (
    <div className="relative min-h-screen bg-[#07080d] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-x-hidden select-none font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] bg-indigo-900/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -top-10 -left-20 w-80 h-80 bg-violet-900/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <WalaceLogo size="md" showText={true} />

        <div className="flex items-center gap-3">
          {!currentUser ? (
            <button
              onClick={onOpenAuthModal}
              id="btn-landing-login-google"
              className="flex items-center gap-2.5 bg-white hover:bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-white/10 transition-all active:scale-95 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
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
              className="flex items-center gap-2.5 bg-[#10131f] hover:bg-[#161a2b] border border-[#22283d] text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-5 h-5 rounded-full object-cover border border-indigo-400"
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
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto my-auto z-10 flex flex-col items-center text-center py-6 sm:py-8 space-y-7">
        {/* Hero Title & Subtitle */}
        <div className="flex flex-col items-center space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold tracking-wide">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>WebRTC P2P de Alta Fidelidade</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Transmita sua gameplay e assista junto com amigos
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl">
            Compartilhamento de tela em tempo real a <strong>1080p 60 FPS</strong> com áudio estéreo nativo, bate-papo e salas privadas. Sem downloads ou instalações.
          </p>
        </div>

        {/* Security / Community Notice Banner */}
        <div className="w-full max-w-2xl bg-red-950/20 border border-red-900/40 rounded-2xl p-3.5 text-left flex items-center gap-3 backdrop-blur-sm">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <div className="text-xs text-zinc-300 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span>Ambiente seguro para gameplays e filmes entre amigos.</span>
            <button
              type="button"
              onClick={onOpenTermsModal}
              className="text-red-400 hover:text-red-300 underline font-semibold text-[11px] cursor-pointer whitespace-nowrap"
            >
              Ver Regras da Comunidade
            </button>
          </div>
        </div>

        {/* Action Center Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-5 text-left">
          {/* Left Column: Create Room & Join Code (5 cols) */}
          <div className="md:col-span-5 bg-[#0c0e17] border border-[#1d2235] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 flex flex-col justify-between backdrop-blur-md">
            <div className="space-y-4">
              {/* User Account Bar */}
              <div className="flex items-center justify-between bg-[#121524] p-3 rounded-xl border border-[#22283e]">
                {currentUser ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-indigo-400 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow"
                        style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                      >
                        {(currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{currentUser.displayName || currentUser.username}</span>
                        <span className="text-[10px] text-emerald-400 font-medium shrink-0">● Online</span>
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
                        Acesse para criar sua sala
                      </div>
                    </div>
                  </div>
                )}

                {!currentUser ? (
                  <button
                    onClick={onOpenAuthModal}
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Entrar</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenProfileModal}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer shrink-0"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>

              {/* Primary Action Button: Create Room */}
              <button
                id="btn-landing-create-room"
                onClick={handleCreateClick}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Criar Minha Sala</span>
              </button>
            </div>

            <div>
              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-zinc-800 flex-1" />
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
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
                  placeholder="Código da sala (ex: dmg-game)"
                  className="flex-1 bg-[#121524] border border-[#22283e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <button
                  id="btn-landing-join-room"
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="px-4 py-2.5 bg-[#171b2d] hover:bg-[#1e233b] border border-[#2b3350] text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 active:scale-95"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Public Rooms List (7 cols) */}
          <div className="md:col-span-7 bg-[#0c0e17] border border-[#1d2235] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between border-b border-[#1b2034] pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <h3 className="font-display text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Salas Públicas Ativas
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {publicRooms.length} {publicRooms.length === 1 ? 'sala aberta' : 'salas abertas'}
                </span>
              </div>

              {/* Public Rooms List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {publicRooms.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 space-y-1.5">
                    <Radio className="w-6 h-6 mx-auto text-zinc-600" />
                    <p className="text-xs font-medium">Nenhuma sala pública aberta no momento.</p>
                    <p className="text-[11px] text-zinc-600">Crie a primeira sala ao lado e convide seus amigos!</p>
                  </div>
                ) : (
                  publicRooms.map((room) => {
                    const isPremium = room.isPermanent || room.id === 'dmg-premium';

                    return (
                      <div
                        key={room.id}
                        className={`p-3 rounded-xl flex items-center justify-between gap-3 transition-all border ${
                          isPremium
                            ? 'bg-gradient-to-r from-purple-950/40 via-[#18122a] to-[#121626] border-purple-500/40 hover:border-purple-400 shadow-md'
                            : 'bg-[#121524] hover:bg-[#181d30] border-[#22283e] hover:border-indigo-500/40'
                        }`}
                      >
                        {/* Room & Host Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            {isPremium ? (
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow border border-purple-400/40">
                                <Crown className="w-4 h-4 text-amber-300" />
                              </div>
                            ) : room.host?.avatar ? (
                              <img
                                src={room.host.avatar}
                                alt={room.host.name}
                                className="w-9 h-9 rounded-xl object-cover border border-indigo-400 bg-zinc-800"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow"
                                style={{ backgroundColor: room.host?.avatarColor || '#6366f1' }}
                              >
                                {(room.host?.name || 'Gamer').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-xs truncate font-mono ${isPremium ? 'text-purple-200 flex items-center gap-1' : 'text-zinc-100'}`}>
                                {isPremium && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
                                <span>{room.name || room.id}</span>
                              </span>

                              {isPremium ? (
                                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold tracking-wider uppercase shrink-0">
                                  OFICIAL 24/7
                                </span>
                              ) : room.streamingCount > 0 ? (
                                <span className="px-1.5 py-0.2 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-bold tracking-wider uppercase shrink-0 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  AO VIVO
                                </span>
                              ) : null}
                            </div>

                            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5 truncate">
                              <span>
                                {isPremium ? 'Sala Oficial' : `Dono: ${room.host?.name || 'Anfitrião'}`}
                              </span>
                              <span>•</span>
                              {room.emptyCountdownSecs !== null && room.emptyCountdownSecs !== undefined && room.userCount === 0 ? (
                                <span className="text-amber-400 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Fechando em {room.emptyCountdownSecs}s</span>
                                </span>
                              ) : (
                                <span className="text-indigo-300 font-medium flex items-center gap-1">
                                  <Users className="w-3 h-3 text-indigo-400" />
                                  <span>{room.userCount} {room.userCount === 1 ? 'pessoa' : 'pessoas'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Join Button */}
                        <button
                          onClick={() => handleQuickJoin(room.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
                            isPremium
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                          }`}
                          title={`Entrar em ${room.name}`}
                        >
                          <span>Entrar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Live Stats Footer */}
            <div className="pt-2.5 border-t border-[#1b2034] flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>P2P de Baixa Latência</span>
              </span>
              <span className="text-emerald-400 font-mono font-medium">● Servidor Ativo</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-4xl">
          <div className="bg-[#0c0e17] border border-[#1d2235] rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">1080p a 60 FPS</div>
              <div className="text-[11px] text-zinc-400">Taxa de quadros fluida para jogos de ação.</div>
            </div>
          </div>

          <div className="bg-[#0c0e17] border border-[#1d2235] rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Som Estéreo & DJ Bot</div>
              <div className="text-[11px] text-zinc-400">Capture o som do PC ou toque com !playmusic.</div>
            </div>
          </div>

          <div className="bg-[#0c0e17] border border-[#1d2235] rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Salas com Moderação</div>
              <div className="text-[11px] text-zinc-400">Comandos fáceis de moderação no chat.</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto z-10 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 border-t border-zinc-900/80">
        <div className="flex items-center gap-2">
          <span>Walace Mendes © 2026</span>
          <span>•</span>
          <span>DMG Live Share</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenTermsModal}
            className="hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 underline"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Diretrizes de Segurança & Moderação</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
