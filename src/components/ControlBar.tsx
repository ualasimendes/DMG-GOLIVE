import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Share2,
  StopCircle,
  Video,
  VideoOff,
  Maximize2,
  LogOut,
  MessageSquare,
  Radio,
} from 'lucide-react';

interface ControlBarProps {
  isMicMuted: boolean;
  onToggleMic: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  isStreaming: boolean;
  onToggleShare: () => void;
  isCameraOn: boolean;
  onToggleCamera: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  unreadMessagesCount?: number;
  onToggleFullscreen: () => void;
  onLeaveRoom: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isMicMuted,
  onToggleMic,
  isAudioMuted,
  onToggleAudio,
  isStreaming,
  onToggleShare,
  isCameraOn,
  onToggleCamera,
  isChatOpen = false,
  onToggleChat,
  unreadMessagesCount = 0,
  onToggleFullscreen,
  onLeaveRoom,
}) => {
  return (
    <footer
      id="walace-control-bar"
      className="h-16 sm:h-18 bg-[#090b14]/95 backdrop-blur-xl border-t border-[#1a1f30] px-4 sm:px-8 flex items-center justify-between z-20 shrink-0 select-none font-sans"
    >
      {/* Left Info Indicator */}
      <div className="hidden md:flex items-center gap-2.5">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </div>
        <span className="text-xs font-semibold text-zinc-200">Voz Conectada</span>
        <span className="text-[10px] text-zinc-400 font-mono bg-[#141828] px-2 py-0.5 rounded border border-[#22283e]">
          WebRTC HD
        </span>
      </div>

      {/* Main Control Cluster (Centered) */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto">
        {/* Microfone */}
        <button
          id="btn-ctrl-mic"
          onClick={onToggleMic}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border cursor-pointer active:scale-95 ${
            isMicMuted
              ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25 shadow-sm'
              : 'bg-[#121524] text-zinc-200 border-[#22283e] hover:bg-[#181d30] hover:text-white'
          }`}
          title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
        >
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Áudio */}
        <button
          id="btn-ctrl-audio"
          onClick={onToggleAudio}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border cursor-pointer active:scale-95 ${
            isAudioMuted
              ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25 shadow-sm'
              : 'bg-[#121524] text-zinc-200 border-[#22283e] hover:bg-[#181d30] hover:text-white'
          }`}
          title={isAudioMuted ? 'Desmutar Áudio' : 'Mutar Áudio'}
        >
          {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* COMPARTILHAR TELA - Primary Action */}
        <button
          id="btn-ctrl-share"
          onClick={onToggleShare}
          className={`px-4 sm:px-6 h-11 rounded-2xl flex items-center gap-2 font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg cursor-pointer active:scale-95 ${
            isStreaming
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 border border-red-400/40'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 border border-indigo-400/30'
          }`}
          title={isStreaming ? 'Parar Compartilhamento de Tela' : 'Transmitir Minha Tela'}
        >
          {isStreaming ? (
            <>
              <StopCircle className="w-4 h-4 text-white animate-pulse" />
              <span className="hidden xs:inline">Parar Tela</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-white" />
              <span>Compartilhar Tela</span>
            </>
          )}
        </button>

        {/* Câmera */}
        <button
          id="btn-ctrl-camera"
          onClick={onToggleCamera}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border cursor-pointer active:scale-95 ${
            isCameraOn
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
              : 'bg-[#121524] text-zinc-200 border-[#22283e] hover:bg-[#181d30] hover:text-white'
          }`}
          title={isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Chat / Membros Toggle Button */}
        {onToggleChat && (
          <button
            id="btn-ctrl-chat"
            onClick={onToggleChat}
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border cursor-pointer active:scale-95 ${
              isChatOpen
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                : 'bg-[#121524] text-zinc-200 border-[#22283e] hover:bg-[#181d30] hover:text-white'
            }`}
            title={isChatOpen ? 'Ocultar Painel Lateral' : 'Abrir Chat e Membros'}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadMessagesCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#090b14]">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        )}

        {/* Tela cheia */}
        <button
          id="btn-ctrl-fullscreen"
          onClick={onToggleFullscreen}
          className="w-11 h-11 rounded-2xl bg-[#121524] text-zinc-200 border border-[#22283e] hover:bg-[#181d30] hover:text-white items-center justify-center transition-all duration-200 cursor-pointer hidden sm:flex active:scale-95"
          title="Tela Cheia"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

        {/* Sair da sala */}
        <button
          id="btn-ctrl-leave"
          onClick={onLeaveRoom}
          className="w-11 h-11 rounded-2xl bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ml-1"
          title="Sair da Sala"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Right side spacer */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-[11px] font-mono text-zinc-400 font-medium">DMG LIVE SHARE</span>
      </div>
    </footer>
  );
};
