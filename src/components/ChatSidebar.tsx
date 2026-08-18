import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Users, MessageSquare, Flame, Trophy, 
  Gamepad2, Skull, Popcorn, Sparkles, Smile,
  Volume2, Mic, MicOff, Monitor
} from 'lucide-react';
import { ChatMessage, User } from '../types';
import confetti from 'canvas-confetti';

interface ChatSidebarProps {
  messages: ChatMessage[];
  users: User[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_REACTIONS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎮', label: 'GG' },
  { emoji: '🏆', label: 'Clutch' },
  { emoji: '💀', label: 'RIP' },
  { emoji: '🍿', label: 'Eita' },
  { emoji: '🚀', label: 'Brabo' },
  { emoji: '😂', label: 'Kkk' },
];

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  messages,
  users,
  currentUserId,
  onSendMessage,
  onSendReaction,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const triggerReaction = (emoji: string) => {
    onSendReaction(emoji);
    
    // Confetti effect
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85, x: 0.8 },
      ticks: 150,
      shapes: ['circle'],
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  if (!isOpen) return null;

  return (
    <aside id="chat-and-members-sidebar" className="w-80 h-full bg-zinc-950 border-l border-zinc-800/80 flex flex-col z-20">
      {/* Top Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg">
          <button
            id="tab-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({messages.length})</span>
          </button>
          <button
            id="tab-users"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Jogadores ({users.length})</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 hover:bg-zinc-900 rounded"
          title="Ocultar Painel"
        >
          ✕
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium">Nenhuma mensagem ainda</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Mande um alô para os amigos durante a gameplay!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="text-center my-1.5">
                      <span className="text-[11px] text-zinc-500 bg-zinc-900/90 px-2.5 py-0.5 rounded-full border border-zinc-800/80">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.senderId === currentUserId;

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: msg.avatarColor || '#a1a1aa' }}
                      >
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`text-xs px-3 py-2 rounded-xl max-w-[90%] break-words leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick reactions bar */}
          <div className="px-3 py-1.5 border-t border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between gap-1">
            {QUICK_REACTIONS.map((r) => (
              <button
                key={r.emoji}
                onClick={() => triggerReaction(r.emoji)}
                className="hover:scale-125 transition-transform p-1 text-sm rounded hover:bg-zinc-800/70"
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>

          {/* Message input */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Users / Members tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-2">
            Conectados ({users.length})
          </div>

          {users.map((u) => {
            const isMe = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="relative w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                    style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                  >
                    {u.name.slice(0, 2).toUpperCase()}
                    {u.isSpeaking && (
                      <span className="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                      {u.name}
                      {isMe && <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800 px-1.5 py-0.2 rounded font-semibold">Eu</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      {u.isStreaming ? (
                        <span className="text-red-400 font-medium flex items-center gap-0.5">
                          <Monitor className="w-3 h-3" /> Transmitindo
                        </span>
                      ) : (
                        <span>Ouvindo</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-400">
                  {u.isMuted ? (
                    <MicOff className="w-3.5 h-3.5 text-red-400" title="Microfone Mutado" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-zinc-400" title="Microfone Ativo" />
                  )}
                  {u.isStreaming && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Ao vivo" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
