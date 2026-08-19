import React, { useState } from 'react';
import { X, LogOut, Check, Save, ShieldCheck, Mail } from 'lucide-react';
import { AuthUser } from '../types';
import { getApiBaseUrl } from '../utils/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUpdateUser: (updatedUser: AuthUser) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.username);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const token = localStorage.getItem('dmg_auth_token');
      const apiBase = getApiBaseUrl();

      if (token) {
        const res = await fetch(`${apiBase}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: displayName.trim(),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            localStorage.setItem('dmg_auth_user', JSON.stringify(data.user));
            onUpdateUser(data.user);
          }
        }
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans">
      <div
        id="modal-profile"
        className="w-full max-w-md bg-[#0c0e17] border border-[#1e2338] rounded-3xl p-6 sm:p-7 shadow-2xl relative text-zinc-100 space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-xl"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg border-2 border-white/20"
              style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
            >
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h3 className="font-display text-lg font-bold text-white">{displayName}</h3>
            {currentUser.email ? (
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currentUser.email}</span>
              </p>
            ) : (
              <p className="text-xs text-zinc-400 font-mono">@{currentUser.username}</p>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold mt-1">
              ✓ Conta Google Verificada
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-300">
              Nome de Exibição na Sala
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#121524] border border-[#20253c] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 min-h-[44px]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Logout Button */}
        <div className="pt-3 border-t border-[#191d2c] flex justify-between items-center">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sessão Google OAuth</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
