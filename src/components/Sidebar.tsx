import React, { useState, useEffect, useRef } from 'react';
import { Plus, Settings, FolderGit2, LogIn, Trash2, Copy, LogOut, MoreVertical, Check } from 'lucide-react';
import { WalaceLogo } from './WalaceLogo';
import { AuthUser } from '../types';
import { getShareableRoomUrl } from '../utils/api';

interface SidebarProps {
  currentUser: AuthUser | null;
  activeRoomId: string;
  activeRoomName?: string;
  onOpenCreateRoom: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onLeaveRoom?: () => void;
  onCloseRoom?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeRoomId,
  activeRoomName,
  onOpenCreateRoom,
  onOpenSettings,
  onOpenProfile,
  onLeaveRoom,
  onCloseRoom,
}) => {
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeRoomId) return;

    // Position menu near cursor
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenu({ x, y });
  };

  const handleCopyLink = () => {
    if (!activeRoomId) return;
    const url = getShareableRoomUrl(activeRoomId);
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setContextMenu(null);
    }, 1200);
  };

  const handleLeave = () => {
    setContextMenu(null);
    if (onLeaveRoom) onLeaveRoom();
  };

  const handleDeleteRoom = () => {
    setContextMenu(null);
    if (onCloseRoom) onCloseRoom();
  };

  // Close context menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    if (contextMenu) {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  return (
    <>
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

        <div className="w-8 h-[1px] bg-[#1a1e2c] mb-3" />

        {/* Add / Create Room Button */}
        <div className="group relative mb-3">
          <button
            id="btn-add-room-sidebar"
            onClick={onOpenCreateRoom}
            className="w-11 h-11 rounded-2xl bg-[#131622] hover:bg-indigo-600/30 text-zinc-400 hover:text-indigo-300 border border-[#212638] hover:border-indigo-500/50 flex items-center justify-center transition-all duration-200 group-hover:rounded-xl active:scale-95 cursor-pointer"
            title="Criar Nova Sala (ex: ROOM #0001)"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Criar Nova Sala
          </div>
        </div>

        {/* Current Active Room Indicator with Right-Click Menu support */}
        <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto no-scrollbar py-1">
          {activeRoomId && (
            <div className="group relative flex items-center justify-center">
              {/* Active pill indicator */}
              <div className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r transition-all duration-200" />

              <button
                id="btn-active-room-sidebar"
                onContextMenu={handleContextMenu}
                onClick={handleContextMenu}
                className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs font-mono border border-indigo-400/40 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                title={`${activeRoomName || activeRoomId} (Clique com botão direito para opções)`}
              >
                {((activeRoomName || activeRoomId).match(/\d+/)?.[0] ? `#${(activeRoomName || activeRoomId).match(/\d+/)?.[0].slice(-2)}` : 'AO')}
              </button>

              <div className="absolute left-16 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-xs rounded-md shadow-xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="font-bold text-indigo-300">{activeRoomName || activeRoomId}</div>
                <div className="text-[10px] text-zinc-400">Clique com botão direito para fechar/excluir</div>
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

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-52 bg-[#0e111c] border border-[#23293e] rounded-xl p-1.5 shadow-2xl text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          <div className="px-3 py-1.5 border-b border-[#1b2032] mb-1">
            <div className="font-bold text-zinc-100 truncate font-mono text-[11px]">
              {activeRoomName || activeRoomId}
            </div>
            <div className="text-[10px] text-zinc-500">Opções da Sala</div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full px-2.5 py-2 text-left hover:bg-[#181c2d] hover:text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{copied ? 'Link Copiado!' : 'Copiar Link da Sala'}</span>
          </button>

          <button
            onClick={handleLeave}
            className="w-full px-2.5 py-2 text-left hover:bg-[#181c2d] hover:text-zinc-100 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span>Sair da Sala</span>
          </button>

          <div className="my-1 border-t border-[#1b2032]" />

          <button
            onClick={handleDeleteRoom}
            className="w-full px-2.5 py-2 text-left hover:bg-red-950/60 text-red-400 hover:text-red-300 rounded-lg flex items-center gap-2 transition-colors font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Excluir / Fechar Sala</span>
          </button>
        </div>
      )}
    </>
  );
};
