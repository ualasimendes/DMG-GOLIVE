import React, { useState } from 'react';
import { X, Sliders, Mic, Monitor, Volume2, Check, ShieldCheck } from 'lucide-react';
import { StreamQuality } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamQuality: StreamQuality;
  onUpdateQuality: (quality: StreamQuality) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  streamQuality,
  onUpdateQuality,
}) => {
  const [selectedRes, setSelectedRes] = useState(streamQuality.resolution);
  const [selectedFps, setSelectedFps] = useState(streamQuality.fps);
  const [selectedBitrate, setSelectedBitrate] = useState(streamQuality.bitrate || '8000 Kbps');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateQuality({
      ...streamQuality,
      resolution: selectedRes,
      fps: selectedFps,
      bitrate: selectedBitrate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="modal-settings"
        className="w-full max-w-md bg-[#0e1019] border border-[#212638] rounded-2xl p-6 shadow-2xl relative text-zinc-100 space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Configurações de Transmissão</h3>
            <p className="text-xs text-zinc-400">DMG LIVE SHARE • Transmissão em Alta Fidelidade</p>
          </div>
        </div>

        {/* Quality Settings */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            Resolução de Transmissão
          </label>

          {/* Resolution Options */}
          <div className="grid grid-cols-4 gap-2">
            {(['720p', '1080p', '1440p', '4K'] as const).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => {
                  setSelectedRes(res);
                  if (res === '4K') setSelectedBitrate('18000 Kbps');
                  else if (res === '1440p') setSelectedBitrate('12000 Kbps');
                  else if (res === '1080p') setSelectedBitrate('8000 Kbps');
                  else setSelectedBitrate('4000 Kbps');
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedRes === res
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/25'
                    : 'bg-[#141624] text-zinc-400 border-[#23283c] hover:bg-[#1a1e30]'
                }`}
              >
                {res}
              </button>
            ))}
          </div>

          {/* FPS Options */}
          <div className="grid grid-cols-2 gap-2">
            {([30, 60] as const).map((fps) => (
              <button
                key={fps}
                type="button"
                onClick={() => setSelectedFps(fps)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedFps === fps
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/25'
                    : 'bg-[#141624] text-zinc-400 border-[#23283c] hover:bg-[#1a1e30]'
                }`}
              >
                {fps} FPS {fps === 60 && '🔥 (Jogos e Filmes)'}
              </button>
            ))}
          </div>

          {/* Bitrate Options */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-zinc-400">
              Taxa de Dados / Bitrate (Nitidez da Imagem)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: '4.000 Kbps (Básico)', value: '4000 Kbps' },
                { label: '8.000 Kbps (1080p HD)', value: '8000 Kbps' },
                { label: '12.000 Kbps (2K Ultra)', value: '12000 Kbps' },
                { label: '18.000 Kbps (4K Máx)', value: '18000 Kbps' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedBitrate(item.value)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-left ${
                    selectedBitrate === item.value
                      ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-[#141624] text-zinc-400 border-[#23283c] hover:bg-[#1a1e30]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice & Audio Filters */}
        <div className="space-y-2 pt-2 border-t border-[#1b1e2a]">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            Processamento de Voz do Microfone
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#131622] border border-[#212638] cursor-pointer hover:bg-[#181c2b] transition-colors">
            <span className="text-xs text-zinc-200">Supressão de Ruído de Fundo</span>
            <input
              type="checkbox"
              checked={noiseSuppression}
              onChange={(e) => setNoiseSuppression(e.target.checked)}
              className="accent-indigo-600 w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#131622] border border-[#212638] cursor-pointer hover:bg-[#181c2b] transition-colors">
            <span className="text-xs text-zinc-200">Cancelamento de Eco Acústico</span>
            <input
              type="checkbox"
              checked={echoCancellation}
              onChange={(e) => setEchoCancellation(e.target.checked)}
              className="accent-indigo-600 w-4 h-4 rounded"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#141622] hover:bg-[#1a1e2e] text-zinc-300 text-sm font-semibold border border-[#23283c] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
