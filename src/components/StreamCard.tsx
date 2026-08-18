import React, { useRef, useEffect, useState } from 'react';
import { 
  Volume2, VolumeX, Maximize2, Minimize2, PictureInPicture, 
  Camera, Radio, Sparkles, User as UserIcon, Monitor
} from 'lucide-react';

interface StreamCardProps {
  stream: MediaStream | null;
  userName: string;
  avatarColor: string;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isDeaf?: boolean;
  streamTitle?: string;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({
  stream,
  userName,
  avatarColor,
  isLocal = false,
  isSpeaking = false,
  isMuted = false,
  isDeaf = false,
  streamTitle,
  isTheaterMode = false,
  onToggleTheater,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [volume, setVolume] = useState<number>(100);
  const [isStreamMuted, setIsStreamMuted] = useState<boolean>(isLocal);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasVideoTrack, setHasVideoTrack] = useState<boolean>(false);
  const [streamResolution, setStreamResolution] = useState<string>('1080p 60fps');

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      const vTracks = stream.getVideoTracks();
      setHasVideoTrack(vTracks.length > 0);

      if (vTracks.length > 0) {
        const settings = vTracks[0].getSettings();
        if (settings.width && settings.height) {
          setStreamResolution(`${settings.width}x${settings.height} ${settings.frameRate ? Math.round(settings.frameRate) + 'fps' : ''}`);
        }
      }
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && !isLocal) {
      videoRef.current.volume = isDeaf || isStreamMuted ? 0 : volume / 100;
    }
  }, [volume, isStreamMuted, isDeaf, isLocal]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP not available:', err);
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
      link.download = `liveshare-print-${userName.toLowerCase()}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div
      ref={containerRef}
      id={`stream-card-${userName.replace(/\s+/g, '-').toLowerCase()}`}
      className={`group relative bg-zinc-950 rounded-xl overflow-hidden border transition-all duration-200 flex flex-col justify-center items-center shadow-lg ${
        isSpeaking ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950 border-emerald-500/50' : 'border-zinc-800/80 hover:border-zinc-700'
      } ${isTheaterMode ? 'w-full h-full min-h-[500px]' : 'aspect-video w-full'}`}
    >
      {/* Video Element */}
      {stream && hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isStreamMuted || isDeaf}
          className="w-full h-full object-contain bg-black"
        />
      ) : (
        /* Placeholder when audio only or stream paused */
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-transform shadow-md ${
              isSpeaking ? 'scale-110 ring-4 ring-emerald-500/60 ring-offset-4 ring-offset-zinc-950' : ''
            }`}
            style={{ backgroundColor: avatarColor || '#6366f1' }}
          >
            {userName ? userName.slice(0, 2).toUpperCase() : <UserIcon className="w-8 h-8" />}
          </div>
          <div>
            <div className="text-zinc-200 font-semibold text-base flex items-center justify-center gap-2">
              {userName}
              {isLocal && <span className="text-xs bg-indigo-900/80 text-indigo-300 px-2 py-0.5 rounded-full font-medium">Você</span>}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLocal ? 'Compartilhe sua tela pelo botão abaixo' : 'Conectado no canal de voz'}
            </p>
          </div>
        </div>
      )}

      {/* Top Header Badge Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 bg-zinc-900/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-zinc-800 text-xs shadow-sm">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: avatarColor }}
          />
          <span className="font-medium text-zinc-200">{userName}</span>
          {isLocal && <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Você</span>}
          {hasVideoTrack && (
            <span className="flex items-center gap-1 text-[11px] bg-red-600/90 text-white font-semibold px-1.5 py-0.2 rounded">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> AO VIVO
            </span>
          )}
        </div>

        {hasVideoTrack && (
          <div className="flex items-center gap-1.5">
            <span className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-zinc-400 text-[10px] font-mono px-2 py-0.5 rounded">
              {streamResolution}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar on Hover */}
      {hasVideoTrack && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-md">
          {/* Left: Stream Info or Volume */}
          <div className="flex items-center gap-3">
            {!isLocal ? (
              <div className="flex items-center gap-2">
                <button
                  id={`btn-mute-stream-${userName.toLowerCase()}`}
                  onClick={() => setIsStreamMuted(!isStreamMuted)}
                  className="p-1 hover:text-white rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
                  title={isStreamMuted ? 'Desmutar stream' : 'Mutar stream'}
                >
                  {isStreamMuted || isDeaf ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={isStreamMuted || isDeaf ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsStreamMuted(false);
                  }}
                  className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  title={`Volume: ${volume}%`}
                />
                <span className="text-[10px] font-mono text-zinc-400">{volume}%</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-emerald-400" /> Sua Transmissão Ativa
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              id={`btn-snapshot-${userName.toLowerCase()}`}
              onClick={takeSnapshot}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Tirar Print da Gameplay"
            >
              <Camera className="w-4 h-4" />
            </button>

            {document.pictureInPictureEnabled && (
              <button
                id={`btn-pip-${userName.toLowerCase()}`}
                onClick={togglePiP}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Picture-in-Picture (Janela Flutuante)"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>
            )}

            {onToggleTheater && (
              <button
                id={`btn-theater-${userName.toLowerCase()}`}
                onClick={onToggleTheater}
                className={`p-1.5 rounded transition-colors ${
                  isTheaterMode ? 'text-indigo-400 bg-indigo-950/60' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={isTheaterMode ? 'Sair do Modo Teatro' : 'Modo Teatro'}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            <button
              id={`btn-fullscreen-${userName.toLowerCase()}`}
              onClick={toggleFullscreen}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Tela Cheia"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
