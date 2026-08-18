import React from 'react';
import { Plus, Settings, FolderGit2, LogIn } from 'lucide-react';
import { WalaceLogo } from './WalaceLogo';
import { AuthUser } from '../types';

interface SidebarProps {
  currentUser: AuthUser | null;
  activeRoomId: string;
  activeRoomName?: string;
  onOpenCreateRoom: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onLeaveRoom?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeRoomId,
  activeRoomName,
  onOpenCreateRoom,
  onOpenSettings,
  onOpenProfile,
  onLeaveRoom,
}) => {
  return (
    <aside
      id="walace-sidebar"
      className="w-16 md:w-18 bg-[#08090f] border-r border-[#191c28] flex flex-col items-center py-3.5 select-none shrink-0 z-20"
    >
      {/* Brand Icon (Home) */}
      <div className="mb-3 group relative flex items-center justify-center">
        <button
          id="btn-logo-home"
          onClick={onLeaveRoom}
          className="transition-transform active:scale-95 focus:outline-none cursor-pointer"
          title="DMG Live Share — Início"
        >
          <WalaceLogo size="md" />
        </button>
        <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          DMG Live Share (Início)
        </div>
      </div>

      {/* Main Site / Projetos Link Icon */}
      <div className="group relative mb-2">
        <a
          href="https://walacemendes.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl bg-[#121422] hover:bg-[#1c2032] text-zinc-400 hover:text-indigo-300 border border-[#21263c] hover:border-indigo-500/50 flex items-center justify-center transition-all"
          title="Voltar ao Portfólio / Aba Projetos"
        >
          <FolderGit2 className="w-4 h-4 text-indigo-400" />
        </a>
        <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Aba Projetos (walacemendes.com.br)
        </div>
      </div>

      <div className="w-8 h-[1px] bg-[#1a1e2c] mb-3" />

      {/* Add / Create Room Button */}
      <div className="group relative mb-3">
        <button
          id="btn-add-room-sidebar"
          onClick={onOpenCreateRoom}
          className="w-11 h-11 rounded-2xl bg-[#131622] hover:bg-indigo-600/30 text-zinc-400 hover:text-indigo-300 border border-[#212638] hover:border-indigo-500/50 flex items-center justify-center transition-all duration-200 group-hover:rounded-xl active:scale-95 cursor-pointer"
          title="Criar Nova Sala"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Criar Nova Sala
        </div>
      </div>

      {/* Current Active Room Indicator (Only shows current room, no stale room collection) */}
      <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto no-scrollbar py-1">
        {activeRoomId && (
          <div className="group relative flex items-center justify-center">
            {/* Active pill indicator */}
            <div className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r transition-all duration-200" />

            <div
              className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono border border-indigo-400/40 shadow-lg shadow-indigo-600/30"
              title={activeRoomName || activeRoomId}
            >
              {((activeRoomName || activeRoomId).match(/\d+/)?.[0] ? `#${(activeRoomName || activeRoomId).match(/\d+/)?.[0].slice(-2)}` : 'AO')}
            </div>

            <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              <span className="font-bold text-indigo-300">{activeRoomName || activeRoomId}</span> (Sala Atual)
            </div>
          </div>
        )}
      </div>

      {/* User Profile & Settings at Bottom */}
      <div className="flex flex-col items-center gap-3 pt-2 border-t border-[#191c28] w-full">
        {/* Settings button */}
        <div className="group relative">
          <button
            id="btn-settings-sidebar"
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl bg-[#11131e] hover:bg-[#191d2c] text-zinc-400 hover:text-zinc-200 border border-[#202538] flex items-center justify-center transition-colors cursor-pointer"
            title="Configurações de Transmissão"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Configurações
          </div>
        </div>

        {/* Current User Avatar & Profile Modal Trigger */}
        <div className="group relative">
          {currentUser ? (
            <button
              id="btn-profile-sidebar"
              onClick={onOpenProfile}
              className="relative rounded-full focus:outline-none transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Meu Perfil Google"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 bg-zinc-800"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white/20"
                  style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                >
                  {(currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#08090f] rounded-full ring-1 ring-emerald-500/30" />
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-300 transition-colors cursor-pointer"
              title="Fazer Login com Google"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}

          <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            <div className="font-semibold text-zinc-200">
              {currentUser ? (currentUser.displayName || currentUser.username) : 'Não conectado'}
            </div>
            <div className="text-[10px] text-emerald-400">
              {currentUser ? '🟢 Conta Google Ativa' : 'Clique para Fazer Login'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
