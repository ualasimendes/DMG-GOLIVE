import React, { useState } from 'react';
import { X, Copy, Check, Gamepad2, ArrowRight, Link as LinkIcon, Sparkles } from 'lucide-react';
import { getShareableRoomUrl } from '../utils/api';

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
  const [roomName, setRoomName] = useState('Gameplay');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    // Generate clean room slug
    const cleanSlug = roomName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const finalId = `${cleanSlug || 'gameplay'}-${randomSuffix}`;

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
      onCreateAndJoin(roomName, createdRoomId);
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
        className="w-full max-w-md bg-[#0e101b] border border-[#21263c] rounded-2xl p-6 shadow-2xl relative text-zinc-100"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdRoomId ? (
          /* Step 1: Input Room Name */
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Nova sala</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Dê um nome para sua sala de transmissão de gameplay e filmes.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Nome da sala</label>
              <input
                id="input-create-room-name"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: CS2 da Galera, Sessão Pipoca"
                autoFocus
                className="w-full bg-[#141726] border border-[#232942] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
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
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                Criar sala
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
              <h3 className="text-lg font-bold text-zinc-100">Sala criada com sucesso!</h3>
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
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
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
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
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
