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
  Settings,
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
  onToggleFullscreen,
  onLeaveRoom,
}) => {
  return (
    <footer
      id="walace-control-bar"
      className="h-18 bg-[#090a0f] border-t border-[#1b1e28] px-4 sm:px-8 flex items-center justify-between z-20 shrink-0 select-none"
    >
      {/* Left Info Indicator */}
      <div className="hidden md:flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
        <span className="text-xs font-semibold text-zinc-300">Voz Conectada</span>
        <span className="text-[10px] text-zinc-500 font-mono">/ RTC P2P HD</span>
      </div>

      {/* Main Control Cluster (Centered) */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto">
        {/* Microfone */}
        <button
          id="btn-ctrl-mic"
          onClick={onToggleMic}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 border ${
            isMicMuted
              ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
              : 'bg-[#141722] text-zinc-300 border-[#22283a] hover:bg-[#1d2232] hover:text-white'
          }`}
          title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
        >
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Áudio */}
        <button
          id="btn-ctrl-audio"
          onClick={onToggleAudio}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 border ${
            isAudioMuted
              ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
              : 'bg-[#141722] text-zinc-300 border-[#22283a] hover:bg-[#1d2232] hover:text-white'
          }`}
          title={isAudioMuted ? 'Desmutar Áudio da Sala' : 'Mutar Áudio da Sala'}
        >
          {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* COMPARTILHAR TELA - Main Highlight / Hero Button */}
        <button
          id="btn-ctrl-share"
          onClick={onToggleShare}
          className={`px-4 sm:px-5 h-11 rounded-xl flex items-center gap-2 font-bold text-sm transition-all duration-200 shadow-md ${
            isStreaming
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 border border-red-400/40'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border border-indigo-400/40 active:scale-95'
          }`}
          title={isStreaming ? 'Parar Compartilhamento de Tela' : 'Compartilhar Tela'}
        >
          {isStreaming ? (
            <>
              <StopCircle className="w-4 h-4 text-red-200 animate-pulse" />
              <span className="hidden xs:inline">Parar Tela</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-indigo-200" />
              <span>Compartilhar tela</span>
            </>
          )}
        </button>

        {/* Câmera */}
        <button
          id="btn-ctrl-camera"
          onClick={onToggleCamera}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 border ${
            isCameraOn
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
              : 'bg-[#141722] text-zinc-300 border-[#22283a] hover:bg-[#1d2232] hover:text-white'
          }`}
          title={isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Tela cheia */}
        <button
          id="btn-ctrl-fullscreen"
          onClick={onToggleFullscreen}
          className="w-11 h-11 rounded-xl bg-[#141722] text-zinc-300 border border-[#22283a] hover:bg-[#1d2232] hover:text-white flex items-center justify-center transition-all duration-200"
          title="Tela Cheia"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

        {/* Sair da sala */}
        <button
          id="btn-ctrl-leave"
          onClick={onLeaveRoom}
          className="w-11 h-11 rounded-xl bg-[#201318] text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-200 ml-1 sm:ml-2"
          title="Sair da Sala"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Right side spacer for balanced centered dock */}
      <div className="hidden md:flex items-center gap-2 opacity-60">
        <span className="text-[11px] font-mono text-zinc-400">walacemendes.com.br</span>
      </div>
    </footer>
  );
};
