import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, MonitorUp, Users, Sparkles, Globe, 
  ArrowRight, ShieldCheck, Volume2, Mic, Zap, Play
} from 'lucide-react';

interface LobbyViewProps {
  initialRoomId?: string;
  onJoinRoom: (userName: string, roomId: string, avatarColor: string) => void;
  onOpenDomainGuide: () => void;
}

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#3b82f6', // Blue
];

const ROOM_SUGGESTIONS = [
  'squad-warzone',
  'cs2-competitivo',
  'gta-rp-brasil',
  'valorant-rank',
  'amigos-jogos',
];

export const LobbyView: React.FC<LobbyViewProps> = ({
  initialRoomId = '',
  onJoinRoom,
  onOpenDomainGuide,
}) => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check local storage for saved nickname
    const savedName = localStorage.getItem('liveshare_username');
    if (savedName) setUserName(savedName);

    const savedColor = localStorage.getItem('liveshare_color');
    if (savedColor && AVATAR_COLORS.includes(savedColor)) setSelectedColor(savedColor);

    if (!initialRoomId) {
      setRoomId('squad-gamer');
    }
  }, [initialRoomId]);

  const startMicTest = async () => {
    try {
      if (isMicTesting) {
        stopMicTest();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setIsMicTesting(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('Microphone test error:', err);
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicTesting(false);
    setMicVolumeLevel(0);
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = userName.trim() || `Player-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalRoom = (roomId.trim() || 'squad-gamer').toLowerCase().replace(/\s+/g, '-');

    localStorage.setItem('liveshare_username', finalName);
    localStorage.setItem('liveshare_color', selectedColor);

    stopMicTest();
    onJoinRoom(finalName, finalRoom, selectedColor);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-600/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <MonitorUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              LiveShare Play
              <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/80 px-2 py-0.5 rounded-full font-semibold">
                Go Live Alternativo
              </span>
            </h1>
            <p className="text-xs text-zinc-500">Compartilhamento de Tela & Jogos em Tempo Real</p>
          </div>
        </div>

        <button
          id="btn-nav-domain-guide"
          onClick={onOpenDomainGuide}
          className="flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-blue-300">walacemendes.com.br</span>
          <span className="hidden sm:inline text-zinc-500 text-[10px]">Guia DNS</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 z-10 flex-1 flex flex-col justify-center">
        {/* Banner Announcement */}
        <div className="bg-gradient-to-r from-zinc-900/90 via-indigo-950/40 to-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                Sem Discord Go Live no Brasil? Transmita direto para seus amigos!
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Transmissão peer-to-peer em <strong>1080p 60 FPS</strong> com áudio cristalino do jogo (som estéreo) + microfone e chat ao vivo. Sem delay e sem precisar instalar nada!
              </p>
            </div>
          </div>
        </div>

        {/* Join Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          {/* Form Side */}
          <form onSubmit={handleSubmit} className="md:col-span-7 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Seu Nickname / Nome de Jogador
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="input-player-name"
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Gaules, Coringa, Alok..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Cor do seu Perfil
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      selectedColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : 'hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Room Identifier */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Nome ou Código da Sala
              </label>
              <input
                id="input-room-id"
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Ex: squad-cs2, warzone-noite"
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {/* Quick suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[11px] text-zinc-500">Sugestões:</span>
                {ROOM_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setRoomId(sug)}
                    className="text-[11px] font-mono bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-2 py-0.5 rounded transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-join-room-submit"
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-950/60 hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Entrar no Canal e Transmitir</span>
            </button>
          </form>

          {/* Quick Preview & Mic Test Side */}
          <div className="md:col-span-5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Prévia do Jogador
              </div>

              <div className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow"
                  style={{ backgroundColor: selectedColor }}
                >
                  {(userName || 'Gamer').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    {userName || 'Gamer'}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    #{roomId || 'squad'}
                  </div>
                </div>
              </div>

              {/* Microphone Test */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-indigo-400" /> Teste de Microfone
                  </span>
                  <button
                    type="button"
                    onClick={startMicTest}
                    className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                      isMicTesting ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {isMicTesting ? 'Parar Teste' : 'Testar Áudio'}
                  </button>
                </div>

                {/* Volume bar meter */}
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-75 ${
                      micVolumeLevel > 60 ? 'bg-emerald-400' : micVolumeLevel > 20 ? 'bg-indigo-400' : 'bg-zinc-700'
                    }`}
                    style={{ width: `${isMicTesting ? micVolumeLevel : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  {isMicTesting
                    ? micVolumeLevel > 5
                      ? 'Áudio detectado com sucesso!'
                      : 'Fale no microfone para testar...'
                    : 'Clique em Testar Áudio para calibrar antes da gameplay.'}
                </p>
              </div>
            </div>

            {/* Quick Features List */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>WebRTC Criptografado Ponta-a-Ponta</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Som estéreo do jogo + microfone sem eco</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Pronto para usar em walacemendes.com.br</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto p-4 sm:p-6 text-center text-xs text-zinc-600 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-zinc-900">
        <div>
          LiveShare Play • Solução rápida e leve para compartilhamento de tela durante gameplay
        </div>
        <button
          onClick={onOpenDomainGuide}
          className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] transition-colors"
        >
          Configurar no Domínio walacemendes.com.br ➔
        </button>
      </footer>
    </div>
  );
};
