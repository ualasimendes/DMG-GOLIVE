import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Send,
  Radio,
  Gamepad2,
  MicOff,
  Sparkles,
  MessageSquare,
  Flame,
  Laugh,
  Skull,
  Popcorn,
  Share2,
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { getShareableRoomUrl } from '../utils/api';
import confetti from 'canvas-confetti';

interface RightPanelProps {
  roomName: string;
  roomId: string;
  participants: UserProfile[];
  currentUserId: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onSelectStreamer: (streamerId: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  roomName,
  roomId,
  participants,
  currentUserId,
  messages,
  onSendMessage,
  onSendReaction,
  onSelectStreamer,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');

  const shareUrl = getShareableRoomUrl(roomId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
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

  return (
    <aside
      id="walace-right-panel"
      className="w-72 lg:w-80 bg-[#0c0d16] border-l border-[#1b1e2a] flex flex-col h-full shrink-0 select-none z-10"
    >
      {/* Header with Room Info */}
      <div className="p-3.5 border-b border-[#1b1e2a] bg-[#0e101b]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Sala:
            </span>
            <span className="text-sm font-bold text-zinc-100 truncate">
              {roomName}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-mono font-medium shrink-0">
            {participants.length} {participants.length === 1 ? 'amigo' : 'amigos'}
          </span>
        </div>

        {/* Quick Link Share Bar */}
        <div className="flex items-center gap-1.5 bg-[#141624] rounded-lg p-1.5 border border-[#21263c]">
          <span className="text-[11px] font-mono text-zinc-400 truncate flex-1 pl-1">
            {shareUrl.replace(/^https?:\/\//, '')}
          </span>
          <button
            id="btn-copy-room-link"
            onClick={handleCopyLink}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
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
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'participants'
              ? 'text-indigo-400 border-indigo-500 bg-[#121422]/50'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Participantes ({participants.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'chat'
              ? 'text-indigo-400 border-indigo-500 bg-[#121422]/50'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat da Sala</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'participants' ? (
        /* Participants List */
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
            Conectados agora
          </div>

          {participants.map((user) => {
            const isMe = user.id === currentUserId;
            const isStreaming = user.isStreaming;

            return (
              <div
                key={user.id}
                onClick={() => isStreaming && onSelectStreamer(user.id)}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  isStreaming
                    ? 'bg-indigo-950/30 border-indigo-500/40 hover:border-indigo-500/70 cursor-pointer shadow-sm'
                    : 'bg-[#111320]/60 border-transparent hover:bg-[#151828]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
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
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0c0d16] ${
                        user.status === 'online' || !user.status ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {user.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-zinc-400 font-mono">(Você)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
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

                {/* Right side indicators */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {user.isMuted && (
                    <span title="Microfone mutado" className="text-zinc-500">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  )}

                  {/* 🔴 AO VIVO BADGE */}
                  {isStreaming && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      AO VIVO
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Chat View */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium">Nenhuma mensagem ainda</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Mande uma mensagem para a galera durante o jogo!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="text-center my-1.5">
                      <span className="text-[10px] text-zinc-500 bg-[#121422] px-2.5 py-0.5 rounded-full border border-zinc-800">
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
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-zinc-300 text-[11px] truncate">
                          {msg.senderName}
                        </span>
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

          {/* Quick reactions */}
          <div className="px-3 py-1.5 border-t border-[#1b1e2a] flex items-center justify-around bg-[#0a0b12]">
            {[
              { emoji: '🔥', label: 'Fogo' },
              { emoji: '🎮', label: 'GG' },
              { emoji: '💀', label: 'Morte' },
              { emoji: '🍿', label: 'Pipoca' },
              { emoji: '👏', label: 'Palmas' },
              { emoji: '🚀', label: 'Brabo' },
            ].map((item) => (
              <button
                key={item.emoji}
                onClick={() => sendQuickReaction(item.emoji)}
                className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-sm transition-transform active:scale-125"
                title={item.label}
              >
                {item.emoji}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-[#1b1e2a] bg-[#0e101b]">
            <div className="flex items-center gap-1.5 bg-[#141624] rounded-xl p-1 border border-[#22283e] focus-within:border-indigo-500 transition-colors">
              <input
                type="text"
                placeholder="Enviar mensagem para a sala..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
