import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Gamepad2, ArrowRight, ShieldAlert } from 'lucide-react';
import { getShareableRoomUrl, getApiBaseUrl } from '../utils/api';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAndJoin: (roomName: string, roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateAndJoin,
}) => {
  const [roomName, setRoomName] = useState('ROOM #0001');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(true);

  // Fetch active rooms on open to suggest the next sequential number (ROOM #0001, ROOM #0002, etc.)
  useEffect(() => {
    if (!isOpen) return;

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/rooms`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const activeCount = data?.rooms?.length || 0;
        const nextNum = String(activeCount + 1).padStart(4, '0');
        setRoomName(`ROOM #${nextNum}`);
      })
      .catch(() => {
        setRoomName('ROOM #0001');
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedGuidelines) return;

    const cleanInput = roomName.trim() || 'ROOM #0001';

    // Match ROOM #0001 pattern or generate clean slug
    const matchNumber = cleanInput.match(/#?(\d+)/);
    let finalId = '';

    if (cleanInput.toUpperCase().startsWith('ROOM') && matchNumber) {
      const padNum = String(matchNumber[1]).padStart(4, '0');
      finalId = `room-${padNum}`;
    } else {
      const cleanSlug = cleanInput
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      finalId = `${cleanSlug || 'room'}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    setCreatedRoomId(finalId);
  };

  const shareUrl = createdRoomId ? getShareableRoomUrl(createdRoomId) : '';

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    if (createdRoomId) {
      onCreateAndJoin(roomName.trim() || 'ROOM #0001', createdRoomId);
      setCreatedRoomId(null);
      onClose();
    }
  };

  const handleClose = () => {
    setCreatedRoomId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="modal-create-room"
        className="w-full max-w-md bg-[#0e101b] border border-[#21263c] rounded-2xl p-6 shadow-2xl relative text-zinc-100 space-y-4"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdRoomId ? (
          /* Step 1: Input Room Name & Agreement */
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-2">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Criar Nova Sala</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Transmissão em 1080p 60 FPS. A sala fechará automaticamente quando todos saírem.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Nome da sala</label>
              <input
                id="input-create-room-name"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: ROOM #0001"
                autoFocus
                className="w-full bg-[#141726] border border-[#232942] rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Safety & Guidelines Warning */}
            <div className="p-3 bg-red-950/30 border border-red-900/60 rounded-xl text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Diretrizes de Segurança e Transmissão</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                É expressamente proibida a transmissão de conteúdo <strong>sexual, explícito, violento ou que fira os direitos humanos</strong>. Infratores serão banidos permanentemente.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-[#141624] hover:bg-[#1a1e30] text-zinc-300 text-sm font-semibold border border-[#232840] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-confirm-create-room"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
              >
                Criar Sala
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Created! Show Link & Copy Button */
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-100">{roomName} criada!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Envie o link abaixo para seus amigos entrarem instantaneamente.
              </p>
            </div>

            <div className="space-y-2 text-left bg-[#131626] p-3.5 rounded-xl border border-[#232842]">
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                LINK DIRETO DA SALA
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-[#0d0e19] border border-[#20253c] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none"
                />
                <button
                  id="btn-copy-modal-link"
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              id="btn-enter-created-room"
              onClick={handleEnterRoom}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <span>Entrar na sala</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
