import React, { useState } from 'react';
import { X, Copy, Check, Gamepad2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { getShareableRoomUrl, getApiBaseUrl } from '../utils/api';
import { AuthUser } from '../types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onCreateAndJoin: (roomName: string, roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCreateAndJoin,
}) => {
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [createdRoomName, setCreatedRoomName] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultHostName = currentUser?.displayName || currentUser?.username || 'Gamer';
  const displayRoomName = `Sala do ${defaultHostName}`;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const token = localStorage.getItem('dmg_auth_token');
    const apiBase = getApiBaseUrl();

    try {
      const res = await fetch(`${apiBase}/room/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar sala.');
      }

      setCreatedRoomId(data.roomId);
      setCreatedRoomName(data.roomName);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível criar sua sala.');
    } finally {
      setIsLoading(false);
    }
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
      onCreateAndJoin(createdRoomName || displayRoomName, createdRoomId);
      setCreatedRoomId(null);
      onClose();
    }
  };

  const handleClose = () => {
    setCreatedRoomId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans">
      <div
        id="modal-create-room"
        className="w-full max-w-md bg-[#0c0e17] border border-[#1e2338] rounded-3xl p-6 sm:p-7 shadow-2xl relative text-zinc-100 space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdRoomId ? (
          /* Step 1: Confirmation */
          <form onSubmit={handleCreate} className="space-y-4 text-left">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Criar Minha Sala</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Você terá permissões de Administrador na sala para gerenciar a transmissão.
              </p>
            </div>

            {/* Room Name Display */}
            <div className="space-y-1 bg-[#121524] p-3.5 rounded-2xl border border-[#20263c]">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Nome da Sala
              </label>
              <div className="text-sm font-bold text-indigo-300 font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{displayRoomName}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            {/* Safety Guidelines */}
            <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-2xl text-left space-y-1">
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Diretrizes e Encerramento Automático</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                A sala é encerrada automaticamente quando todos os membros saírem. Você pode tocar músicas (!playmusic) e moderar participantes.
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-[#121524] hover:bg-[#181d30] text-zinc-300 text-sm font-semibold border border-[#20263c] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                id="btn-confirm-create-room"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Criando...' : 'Confirmar & Criar'}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Created! Show Link & Copy Button */
          <div className="space-y-4 text-center">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="font-display text-xl font-bold text-white">{createdRoomName} criada!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Compartilhe o link abaixo para seus amigos entrarem direto.
              </p>
            </div>

            <div className="space-y-2 text-left bg-[#121524] p-3.5 rounded-2xl border border-[#20263c]">
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                LINK DIRETO
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-[#090b14] border border-[#1e2338] rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none"
                />
                <button
                  id="btn-copy-modal-link"
                  onClick={handleCopy}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              <span>Entrar na Sala Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
