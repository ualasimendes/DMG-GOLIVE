import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Send,
  Gamepad2,
  MicOff,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Music,
  X,
  Volume2,
  VolumeX,
  Shield,
  Crown,
  Ban,
  UserX,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { getShareableRoomUrl } from '../utils/api';
import { YouTubeJukebox } from './YouTubeJukebox';
import confetti from 'canvas-confetti';

interface RightPanelProps {
  roomName: string;
  roomId: string;
  participants: UserProfile[];
  currentUserId: string;
  currentUserRole?: 'admin1' | 'admin2' | 'member';
  messages: ChatMessage[];
  activeYouTubeTrack?: {
    videoId: string;
    requestedBy: string;
    isPlaying: boolean;
  } | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onSelectStreamer: (streamerId: string) => void;
  onCloseRoom?: () => void;
  onStopYouTubeTrack?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  roomName,
  roomId,
  participants,
  currentUserId,
  currentUserRole = 'member',
  messages,
  activeYouTubeTrack,
  isMobileOpen = false,
  onCloseMobile,
  onSendMessage,
  onSendReaction,
  onSelectStreamer,
  onCloseRoom,
  onStopYouTubeTrack,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('chat');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const [musicUrlInput, setMusicUrlInput] = useState('');
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});
  const [selectedUserActionMenu, setSelectedUserActionMenu] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const shareUrl = getShareableRoomUrl(roomId);

  const isCallerAdmin1 = currentUserRole === 'admin1';
  const isCallerAdmin2 = currentUserRole === 'admin2';
  const isCallerAdmin = isCallerAdmin1 || isCallerAdmin2;

  // Auto-scroll chat on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmClose = () => {
    setShowConfirmDelete(false);
    if (onCloseRoom) onCloseRoom();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handlePlayMusicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicUrlInput.trim()) return;
    onSendMessage(`!playmusic ${musicUrlInput.trim()}`);
    setMusicUrlInput('');
    setShowMusicPrompt(false);
  };

  const sendQuickReaction = (emoji: string) => {
    onSendReaction(emoji);
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.85, x: 0.85 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  const handleVolumeChange = (userId: string, val: number) => {
    setUserVolumes((prev) => ({ ...prev, [userId]: val }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        id="walace-right-panel"
        className={`
          fixed inset-y-0 right-0 z-50 w-full sm:w-84 md:static md:w-72 lg:w-84
          bg-[#0c0d16] border-l border-[#1b1e2a] flex flex-col h-full shrink-0 select-none font-roboto shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:flex'}
          ${!isMobileOpen ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Header with Room Info */}
        <div className="p-3.5 border-b border-[#1b1e2a] bg-[#0e101b]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Sala:
              </span>
              <span className="text-sm font-bold text-zinc-100 truncate font-mono">
                {roomName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isCallerAdmin1 && (
                <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black tracking-wider uppercase shadow-sm flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  ADMIN 1
                </span>
              )}
              {isCallerAdmin2 && (
                <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  ADMIN 2
                </span>
              )}

              {isCallerAdmin1 && onCloseRoom && (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/50 transition-colors cursor-pointer"
                  title="Excluir / Fechar Sala para todos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Close/Minimize Button for Mobile */}
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Minimizar Chat e Voltar para a Live"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Confirmation Banner for Deleting Room */}
        {showConfirmDelete && (
          <div className="mb-2 p-2.5 bg-red-950/70 border border-red-800/80 rounded-xl text-left space-y-2 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-1.5 text-red-300 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Deseja encerrar e excluir a sala?</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Todos os participantes serão desconectados e a sala deixará de existir.
            </p>
            <div className="flex gap-1.5 pt-0.5">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 py-1 px-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shadow-md shadow-red-600/30 cursor-pointer"
              >
                Excluir Sala
              </button>
            </div>
          </div>
        )}

        {/* Quick Link Share Bar */}
        <div className="flex items-center gap-1.5 bg-[#141624] rounded-lg p-1.5 border border-[#21263c]">
          <span className="text-[11px] font-mono text-zinc-400 truncate flex-1 pl-1">
            {shareUrl.replace(/^https?:\/\//, '')}
          </span>
          <button
            id="btn-copy-room-link"
            onClick={handleCopyLink}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
            title="Copiar Link da Sala"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs (Participantes / Chat) */}
      <div className="flex border-b border-[#1b1e2a] bg-[#0a0b12]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'chat'
              ? 'text-indigo-400 border-indigo-500 bg-[#121422]/50'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat da Sala</span>
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'participants'
              ? 'text-indigo-400 border-indigo-500 bg-[#121422]/50'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Membros ({participants.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'participants' ? (
        /* Participants List */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-0.5 flex items-center justify-between">
            <span>Conectados Agora</span>
            <span>Volume & Moderação</span>
          </div>

          {participants.map((user) => {
            const isMe = user.id === currentUserId;
            const isStreaming = user.isStreaming;
            const userRole = user.role || 'member';
            const userVol = userVolumes[user.id] !== undefined ? userVolumes[user.id] : 100;
            const isTargetAdmin1 = userRole === 'admin1';
            const isTargetAdmin2 = userRole === 'admin2';

            return (
              <div
                key={user.id}
                className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                  isStreaming
                    ? 'bg-indigo-950/30 border-indigo-500/40'
                    : 'bg-[#111320]/70 border-[#1f2438]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => isStreaming && onSelectStreamer(user.id)}
                    className={`flex items-center gap-2 min-w-0 flex-1 ${isStreaming ? 'cursor-pointer' : ''}`}
                  >
                    {/* User Avatar with status dot and speaking ring */}
                    <div className="relative shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className={`w-8 h-8 rounded-full object-cover border border-[#262c42] bg-zinc-800 ${
                            user.isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black' : ''
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow ${
                            user.isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black' : ''
                          }`}
                          style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                        >
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {user.name}
                        </span>
                        {isMe && <span className="text-[10px] text-zinc-400 font-mono">(Você)</span>}

                        {/* Role Badge */}
                        {isTargetAdmin1 && (
                          <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-red-600 to-amber-600 text-white text-[9px] font-black tracking-wider uppercase shadow-sm">
                            ADMIN 1
                          </span>
                        )}
                        {isTargetAdmin2 && (
                          <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-bold tracking-wider uppercase shadow-sm">
                            ADMIN 2
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        {isStreaming ? (
                          <span className="text-indigo-400 font-medium flex items-center gap-0.5">
                            <Gamepad2 className="w-3 h-3" />
                            Transmitindo tela
                          </span>
                        ) : user.isSpeaking ? (
                          <span className="text-emerald-400 font-medium">Falando...</span>
                        ) : (
                          <span>🟢 Online</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Mute status */}
                  <div className="flex items-center gap-1 shrink-0">
                    {user.isMuted && (
                      <span title="Microfone mutado" className="text-red-400 p-1">
                        <MicOff className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {/* Moderation Dropdown Toggle */}
                    {isCallerAdmin && !isMe && !isTargetAdmin1 && (
                      <button
                        onClick={() =>
                          setSelectedUserActionMenu(
                            selectedUserActionMenu === user.id ? null : user.id
                          )
                        }
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                        title="Opções de Moderação"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Individual Volume Slider */}
                {!isMe && (
                  <div className="flex items-center gap-2 pt-1 border-t border-[#1b2034] text-[11px] text-zinc-400">
                    <button
                      onClick={() => handleVolumeChange(user.id, userVol > 0 ? 0 : 100)}
                      className="text-zinc-400 hover:text-white"
                      title={userVol === 0 ? 'Desmutar' : 'Mutar Local'}
                    >
                      {userVol === 0 ? (
                        <VolumeX className="w-3 h-3 text-red-400" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={userVol}
                      onChange={(e) => handleVolumeChange(user.id, Number(e.target.value))}
                      className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="font-mono text-[10px] w-7 text-right">{userVol}%</span>
                  </div>
                )}

                {/* Moderation Action Menu for Admin 1 and Admin 2 */}
                {selectedUserActionMenu === user.id && (
                  <div className="bg-[#0b0c15] border border-[#232942] rounded-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 text-xs">
                    {/* Admin 1 Powers */}
                    {isCallerAdmin1 && (
                      <>
                        <button
                          onClick={() => {
                            onSendMessage(`!setadmin2 ${user.name}`);
                            setSelectedUserActionMenu(null);
                          }}
                          className="w-full text-left px-2 py-1 hover:bg-indigo-950/60 text-indigo-300 rounded flex items-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          <Shield className="w-3 h-3 text-indigo-400" />
                          <span>Promover a ADMIN 2</span>
                        </button>

                        <button
                          onClick={() => {
                            onSendMessage(`!setadmin1 ${user.name}`);
                            setSelectedUserActionMenu(null);
                          }}
                          className="w-full text-left px-2 py-1 hover:bg-amber-950/60 text-amber-300 rounded flex items-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Promover a ADMIN 1</span>
                        </button>

                        {userRole !== 'member' && (
                          <button
                            onClick={() => {
                              onSendMessage(`!removeadmin ${user.name}`);
                              setSelectedUserActionMenu(null);
                            }}
                            className="w-full text-left px-2 py-1 hover:bg-zinc-800 text-zinc-400 rounded flex items-center gap-1.5 cursor-pointer text-[11px]"
                          >
                            <Shield className="w-3 h-3 text-zinc-500" />
                            <span>Remover Admin</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Common Moderation (Admin 1 & Admin 2) */}
                    <button
                      onClick={() => {
                        onSendMessage(`!mute ${user.name}`);
                        setSelectedUserActionMenu(null);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-zinc-800 text-zinc-200 rounded flex items-center gap-1.5 cursor-pointer text-[11px]"
                    >
                      <MicOff className="w-3 h-3 text-amber-400" />
                      <span>Mutar Microfone</span>
                    </button>

                    <button
                      onClick={() => {
                        onSendMessage(`!timeout ${user.name} 5`);
                        setSelectedUserActionMenu(null);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-zinc-800 text-zinc-200 rounded flex items-center gap-1.5 cursor-pointer text-[11px]"
                    >
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Silenciar 5min (Timeout)</span>
                    </button>

                    <button
                      onClick={() => {
                        onSendMessage(`!kick ${user.name}`);
                        setSelectedUserActionMenu(null);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-red-950/50 text-red-400 rounded flex items-center gap-1.5 cursor-pointer text-[11px]"
                    >
                      <UserX className="w-3 h-3 text-red-400" />
                      <span>Expulsar da Sala</span>
                    </button>

                    {isCallerAdmin1 && (
                      <button
                        onClick={() => {
                          onSendMessage(`!ban ${user.name}`);
                          setSelectedUserActionMenu(null);
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-red-900/60 text-red-300 font-bold rounded flex items-center gap-1.5 cursor-pointer text-[11px]"
                      >
                        <Ban className="w-3 h-3 text-red-400" />
                        <span>Banir da Sala</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Chat View */
        <div className="flex-1 flex flex-col min-h-0">
          {/* YouTube Jukebox Dock (If playing) */}
          {activeYouTubeTrack && (
            <div className="p-2 border-b border-red-900/30">
              <YouTubeJukebox
                track={activeYouTubeTrack}
                onStop={onStopYouTubeTrack || (() => onSendMessage('!stopmusic'))}
              />
            </div>
          )}

          {/* Messages Scroll Area */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium">Nenhuma mensagem ainda</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Mande uma mensagem ou digite <code>!help</code> para ver comandos!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.type === 'system') {
                  const isMusicBot = msg.senderName?.includes('YouTube');
                  const isBanOrMute = msg.senderName?.includes('BANIMENTO') || msg.senderName?.includes('Moderação');

                  return (
                    <div key={msg.id} className="text-center my-1.5">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-xl border leading-relaxed inline-block max-w-[95%] ${
                          isBanOrMute
                            ? 'bg-red-950/70 text-red-200 border-red-700/80 font-bold'
                            : isMusicBot
                            ? 'bg-red-950/50 text-red-200 border-red-800/80 font-medium'
                            : 'bg-[#121422] text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.senderId === currentUserId;
                const formattedTime =
                  typeof msg.timestamp === 'number'
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : msg.timestamp;

                return (
                  <div key={msg.id} className="flex items-start gap-2 text-xs">
                    {msg.senderAvatar ? (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-zinc-700"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow"
                        style={{ backgroundColor: msg.avatarColor || '#6366f1' }}
                      >
                        {msg.senderName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-bold text-zinc-200 text-[11px] truncate">
                          {msg.senderName}
                        </span>

                        {/* Sender Role Badge in Chat */}
                        {msg.senderRole === 'admin1' && (
                          <span className="px-1 py-0.2 rounded bg-gradient-to-r from-red-600 to-amber-600 text-white text-[8px] font-black tracking-wider uppercase shadow-xs">
                            ADMIN 1
                          </span>
                        )}
                        {msg.senderRole === 'admin2' && (
                          <span className="px-1 py-0.2 rounded bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] font-bold tracking-wider uppercase shadow-xs">
                            ADMIN 2
                          </span>
                        )}

                        {isMe && <span className="text-[9px] text-indigo-400 font-mono">(Você)</span>}
                        <span className="text-[9px] text-zinc-500">{formattedTime}</span>
                      </div>
                      <p className="text-zinc-200 text-xs break-words mt-0.5 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* YouTube DJ Prompt Dialog */}
          {showMusicPrompt && (
            <form
              onSubmit={handlePlayMusicSubmit}
              className="p-2.5 bg-red-950/70 border-t border-red-800/80 space-y-2 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-red-400" />
                  <span>Tocar Música do YouTube na Sala</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMusicPrompt(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  autoFocus
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={musicUrlInput}
                  onChange={(e) => setMusicUrlInput(e.target.value)}
                  className="flex-1 bg-[#121422] border border-red-800/60 rounded-lg px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={!musicUrlInput.trim()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                >
                  Tocar
                </button>
              </div>
            </form>
          )}

          {/* Quick Actions & Reactions Bar */}
          <div className="px-2 py-1.5 border-t border-[#1b1e2a] flex items-center justify-between bg-[#0a0b12]">
            {/* DJ Bot Launcher Button (Admins only) */}
            {isCallerAdmin ? (
              <button
                onClick={() => setShowMusicPrompt(!showMusicPrompt)}
                className="flex items-center gap-1 px-2 py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                title="Tocar Música com o DJ Bot (!playmusic)"
              >
                <Music className="w-3 h-3 text-red-400" />
                <span>DJ Bot 🎵</span>
              </button>
            ) : (
              <button
                onClick={() => onSendMessage('!help')}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
                title="Ver lista de comandos (!help)"
              >
                <span>Ajuda (!help)</span>
              </button>
            )}

            {/* Quick emoji reactions */}
            <div className="flex items-center gap-1">
              {[
                { emoji: '🔥', label: 'Fogo' },
                { emoji: '🎮', label: 'GG' },
                { emoji: '💀', label: 'Morte' },
                { emoji: '🍿', label: 'Pipoca' },
                { emoji: '👏', label: 'Palmas' },
              ].map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => sendQuickReaction(item.emoji)}
                  className="w-6 h-6 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-xs transition-transform active:scale-125 cursor-pointer"
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Message Input Form */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-[#1b1e2a] bg-[#0e101b]">
            <div className="flex items-center gap-1.5 bg-[#141624] rounded-xl p-1 border border-[#22283e] focus-within:border-indigo-500 transition-colors">
              <input
                type="text"
                placeholder="Enviar mensagem ou !help..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  </>
);
};
