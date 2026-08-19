import React, { useState } from 'react';
import { X, Monitor, Zap, Volume2, Sparkles, CheckCircle2, Radio } from 'lucide-react';
import { StreamQuality } from '../types';

interface StartStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuality: StreamQuality;
  onStart: (quality: StreamQuality) => void;
}

export const StartStreamModal: React.FC<StartStreamModalProps> = ({
  isOpen,
  onClose,
  currentQuality,
  onStart,
}) => {
  const [selectedRes, setSelectedRes] = useState<'720p' | '1080p' | '1440p' | '4K'>(
    (currentQuality.resolution as any) || '1080p'
  );
  const [selectedFps, setSelectedFps] = useState<15 | 30 | 60>(
    (currentQuality.fps as any) === 15 ? 15 : (currentQuality.fps as any) === 30 ? 30 : 60
  );
  const [selectedBitrate, setSelectedBitrate] = useState<string>(
    currentQuality.bitrate || '8000 Kbps'
  );

  if (!isOpen) return null;

  const handleStartStream = () => {
    onStart({
      ...currentQuality,
      resolution: selectedRes,
      fps: selectedFps,
      bitrate: selectedBitrate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans">
      <div
        id="modal-start-stream"
        className="w-full max-w-lg bg-[#0c0e17] border border-[#1e2338] rounded-3xl p-6 sm:p-7 shadow-2xl relative text-zinc-100 space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              Transmitir Minha Tela
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Ao Vivo
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Defina a qualidade antes de capturar a janela ou jogo
            </p>
          </div>
        </div>

        {/* 1. Escolha de Resolução */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            1. Resolução
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '720p', label: '720p HD', desc: 'Conexão leve', defaultBitrate: '4000 Kbps' },
              { id: '1080p', label: '1080p FHD', desc: 'Recomendado ⭐', defaultBitrate: '8000 Kbps' },
              { id: '1440p', label: '1440p 2K', desc: 'Alta definição', defaultBitrate: '12000 Kbps' },
              { id: '4K', label: '4K UHD', desc: 'Ultra nitidez', defaultBitrate: '20000 Kbps' },
            ].map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => {
                  setSelectedRes(res.id as any);
                  setSelectedBitrate(res.defaultBitrate);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRes === res.id
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                    : 'bg-[#121524] border-[#20253c] text-zinc-400 hover:bg-[#181d30] hover:text-zinc-200'
                }`}
              >
                <div className="font-bold text-sm text-white flex items-center justify-between">
                  <span>{res.label}</span>
                  {selectedRes === res.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="text-[10px] text-zinc-400 block mt-1">{res.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Escolha de Taxa de Quadros (FPS) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            2. Taxa de Quadros (FPS)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 15, label: '15 FPS', desc: 'Leve / Apresentações' },
              { value: 30, label: '30 FPS', desc: 'Padrão / Vídeos' },
              { value: 60, label: '60 FPS 🔥', desc: 'Fluido p/ Jogos' },
            ].map((fpsOption) => (
              <button
                key={fpsOption.value}
                type="button"
                onClick={() => setSelectedFps(fpsOption.value as any)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedFps === fpsOption.value
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                    : 'bg-[#121524] border-[#20253c] text-zinc-400 hover:bg-[#181d30] hover:text-zinc-200'
                }`}
              >
                <div className="font-bold text-sm text-white flex items-center justify-between">
                  <span>{fpsOption.label}</span>
                  {selectedFps === fpsOption.value && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 block mt-0.5">{fpsOption.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Taxa de Dados / Bitrate */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            3. Taxa de Bitrate
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: '4000 Kbps', label: '4.000 Kbps' },
              { value: '8000 Kbps', label: '8.000 Kbps' },
              { value: '12000 Kbps', label: '12.000 Kbps' },
              { value: '20000 Kbps', label: '20.000 Kbps' },
            ].map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setSelectedBitrate(b.value)}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                  selectedBitrate === b.value
                    ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-[#121524] border-[#20253c] text-zinc-400 hover:bg-[#181d30]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Tip Banner */}
        <div className="p-3.5 rounded-2xl bg-[#121627] border border-indigo-500/25 flex items-start gap-3 text-xs text-zinc-300 leading-relaxed">
          <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-indigo-300">Transmitir Som do Jogo:</span> Na janela do navegador que abrir a seguir, lembre-se de marcar a opção <strong className="text-white">"Compartilhar áudio do sistema"</strong>.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-[#121524] hover:bg-[#181d30] text-zinc-300 text-sm font-semibold border border-[#20253c] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleStartStream}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[44px]"
          >
            <Radio className="w-4 h-4" />
            <span>Iniciar Transmissão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
