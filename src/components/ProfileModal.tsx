import React, { useState } from 'react';
import { X, User, LogOut, Check, Save, Sparkles, ShieldCheck, Mail } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="modal-profile"
        className="w-full max-w-md bg-[#0c0e17] border border-[#1f2438] rounded-2xl p-6 shadow-2xl relative text-zinc-100 space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-2 border-white/20"
              style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
            >
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-zinc-100">{displayName}</h3>
            {currentUser.email ? (
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
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
              Nome de Exibição / Nickname na Sala
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#141724] border border-[#22283c] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Nome</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Logout Button */}
        <div className="pt-3 border-t border-[#1a1f30] flex justify-between items-center">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google OAuth 2.0 Ativo</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
