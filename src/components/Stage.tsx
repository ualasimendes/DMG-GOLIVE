import React, { useRef, useEffect, useState } from 'react';
import {
  Tv,
  Maximize2,
  Minimize2,
  Radio,
  Wifi,
  Volume2,
  VolumeX,
  PictureInPicture,
  Camera,
  Layers,
  Share2,
} from 'lucide-react';
import { UserProfile, StreamQuality, PeerStreamData } from '../types';

interface StageProps {
  streamer: UserProfile | null;
  allStreamers: UserProfile[];
  onSelectStreamer: (streamerId: string) => void;
  localStream: MediaStream | null;
  isLocalStreaming: boolean;
  onStartShare: () => void;
  streamQuality: StreamQuality;
  roomName: string;
  currentUserId: string;
  remoteStreams: Map<string, PeerStreamData>;
}

export const Stage: React.FC<StageProps> = ({
  streamer,
  allStreamers,
  onSelectStreamer,
  localStream,
  isLocalStreaming,
  onStartShare,
  streamQuality,
  roomName,
  currentUserId,
  remoteStreams,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState<number>(100);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const isMe = streamer?.id === currentUserId;
  const remoteStreamData = streamer && !isMe ? remoteStreams.get(streamer.id) : null;
  const activeMediaStream = isMe ? localStream : (remoteStreamData?.stream || (streamer as any)?.stream || null);
  const hasVideoTrack = !!(
    activeMediaStream &&
    activeMediaStream.getVideoTracks().some((t) => t.readyState === 'live')
  );

  // Bind active media stream to video element
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (activeMediaStream && hasVideoTrack) {
      if (videoEl.srcObject !== activeMediaStream) {
        videoEl.srcObject = activeMediaStream;
      }
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.log('[Stage Video] Autoplay requires muted state on initial frame:', e.message);
          videoEl.muted = true;
          videoEl.play().catch((err) => console.warn('Secondary play warning:', err));
        });
      }
    } else {
      videoEl.srcObject = null;
    }
  }, [activeMediaStream, streamer?.id, hasVideoTrack]);

  // Adjust volume & mute for remote streams
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isMe) {
      videoEl.muted = true; // Avoid local loopback feedback
    } else {
      videoEl.muted = isAudioMuted;
      videoEl.volume = isAudioMuted ? 0 : Math.min(1, Math.max(0, volume / 100));
    }
  }, [isMe, isAudioMuted, volume]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handlePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error('PiP error:', err);
      }
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1920;
    canvas.height = videoRef.current.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = `dmg-liveshare-${streamer?.name || 'gameplay'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const hasStream = !!streamer;

  return (
    <main
      ref={containerRef}
      id="walace-stage"
      className="flex-1 bg-[#07080d] relative flex flex-col items-center justify-center p-2.5 sm:p-4 overflow-hidden select-none font-sans"
    >
      {hasStream ? (
        <div className="w-full h-full flex flex-col relative rounded-2xl overflow-hidden bg-black border border-[#1b2034] shadow-2xl group">
          {/* Top Floating Overlay (Streamer Info & Quality Bar) */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-20 flex items-center justify-between pointer-events-none opacity-95 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold border border-indigo-400/60 shadow"
                style={{ backgroundColor: streamer.avatarColor || '#6366f1' }}
              >
                {streamer.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm tracking-wide">
                    {streamer.name}
                  </span>
                  {isMe && (
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/80 px-2 py-0.2 rounded-md font-semibold">
                      Você
                    </span>
                  )}
                  {/* AO VIVO Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    AO VIVO
                  </span>
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span>{streamer.streamTitle || `Transmissão em #${roomName}`}</span>
                </div>
              </div>
            </div>

            {/* Quality & Action Badges */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="hidden sm:flex items-center gap-2.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-zinc-300">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Wifi className="w-3.5 h-3.5" />
                  {streamQuality.latencyMs}ms
                </span>
                <span className="text-zinc-600">|</span>
                <span>{streamQuality.resolution}</span>
                <span className="text-indigo-400 font-semibold">{streamQuality.fps} FPS</span>
              </div>

              {/* Volume Slider for Remote Stream */}
              {!isMe && (
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title={isAudioMuted ? 'Desmutar Áudio da Live' : 'Mutar Áudio da Live'}
                  >
                    {isAudioMuted ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isAudioMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsAudioMuted(false);
                    }}
                    className="w-14 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}

              {/* Snapshot Button */}
              <button
                onClick={takeSnapshot}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Capturar Foto da Gameplay"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* PiP Button */}
              <button
                onClick={handlePiP}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real Video Player Display */}
          <div className="w-full h-full flex items-center justify-center relative bg-[#040508]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMe || isAudioMuted}
              className="w-full h-full object-contain bg-black"
            />

            {(!activeMediaStream || !hasVideoTrack) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-10 bg-[#0a0c14]">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl animate-pulse"
                  style={{ backgroundColor: streamer.avatarColor || '#6366f1' }}
                >
                  {streamer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-bold text-base flex items-center justify-center gap-2">
                    <span>{streamer.name}</span>
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Ao Vivo
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    Sincronizando stream P2P em tempo real...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Multiple Active Streamers Switcher */}
          {allStreamers.length > 1 && (
            <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Telas Ativas:
              </span>
              <div className="flex items-center gap-1.5">
                {allStreamers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectStreamer(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      s.id === streamer.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          id="walace-stage-empty"
          className="w-full max-w-lg flex flex-col items-center text-center p-8 sm:p-12 rounded-3xl bg-[#0c0e18]/90 border border-[#1e2338] shadow-2xl relative overflow-hidden backdrop-blur-md"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-600/10 blur-[60px] pointer-events-none" />

          {/* Clean Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#121627] border border-[#232b45] flex items-center justify-center text-indigo-400 mb-5 shadow-inner">
            <Tv className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.75]" />
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
            Aguardando Transmissão
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
            Nenhum participante está transmitindo vídeo no momento. O áudio e o bate-papo da sala continuam ativos.
          </p>

          {/* Action Button */}
          <button
            id="btn-stage-start-share"
            onClick={onStartShare}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Transmitir Minha Tela</span>
          </button>
        </div>
      )}
    </main>
  );
};
