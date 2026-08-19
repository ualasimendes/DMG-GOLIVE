import React, { useState } from 'react';
import { Square, ExternalLink, Music, Disc3, Minimize2, Maximize2 } from 'lucide-react';

interface YouTubeJukeboxProps {
  track: {
    videoId: string;
    requestedBy: string;
    isPlaying: boolean;
  } | null;
  onStop: () => void;
}

export const YouTubeJukebox: React.FC<YouTubeJukeboxProps> = ({ track, onStop }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!track || !track.videoId) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${track.videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.origin : ''
  )}`;

  return (
    <div className="w-full bg-gradient-to-r from-red-950/30 via-[#141224] to-[#101322] border border-red-500/30 rounded-2xl p-2.5 sm:p-3 shadow-2xl relative animate-in fade-in slide-in-from-top-3 select-none mb-2.5">
      {/* Embedded YouTube player */}
      <div className={isMinimized ? 'hidden' : 'w-full mb-2.5 overflow-hidden rounded-xl bg-black/80 aspect-video max-h-44 relative border border-white/10'}>
        <iframe
          src={embedUrl}
          title="YouTube Jukebox Music Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full object-cover"
        />
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Track info & Disc Animation */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1 truncate">
                <Music className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>DJ YouTube Bot</span>
              </span>
              <span className="text-[9px] bg-red-950/80 text-red-300 border border-red-800/80 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                TOCANDO
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 flex items-center gap-2 truncate mt-0.5">
              <span>Pedido por: <strong className="text-zinc-200">{track.requestedBy}</strong></span>
              <a
                href={`https://youtu.be/${track.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer"
                title="Abrir no YouTube"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Minimize Video */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-xl bg-[#181b2c] hover:bg-[#20253c] text-zinc-300 hover:text-white border border-[#272e48] transition-colors cursor-pointer text-xs"
            title={isMinimized ? 'Expandir Player' : 'Minimizar Player'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Stop Music Button */}
          <button
            onClick={onStop}
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
            title="Parar Música (!stopmusic)"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Parar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
