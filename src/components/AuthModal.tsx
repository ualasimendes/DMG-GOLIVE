import React, { useState } from 'react';
import { LogIn, UserPlus, Sparkles, User, Lock, AlertCircle, Check, X, Shield, Gamepad2 } from 'lucide-react';
import { AuthUser } from '../types';
import { getApiBaseUrl } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, token: string) => void;
  initialMode?: 'login' | 'register';
}

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const apiBase = getApiBaseUrl();
    const endpoint = mode === 'login' ? `${apiBase}/auth/login` : `${apiBase}/auth/register`;

    try {
      const payload =
        mode === 'login'
          ? { username: username.trim(), password }
          : {
              username: username.trim(),
              password,
              displayName: displayName.trim() || username.trim(),
              avatarColor,
              avatarUrl: avatarUrl.trim() || undefined,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro na requisição.');
      }

      // Save token and auth state
      localStorage.setItem('dmg_auth_token', data.token);
      localStorage.setItem('dmg_auth_user', JSON.stringify(data.user));

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const guestUser: AuthUser = {
      id: `guest_${Date.now()}_${randomNum}`,
      username: `guest_${randomNum}`,
      displayName: `Gamer ${randomNum}`,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      createdAt: Date.now(),
      isGuest: true,
    };

    const guestToken = `guest_token_${Date.now()}`;
    localStorage.setItem('dmg_auth_token', guestToken);
    localStorage.setItem('dmg_auth_user', JSON.stringify(guestUser));

    onAuthSuccess(guestUser, guestToken);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="modal-auth"
        className="w-full max-w-md bg-[#0c0e17] border border-[#1f2438] rounded-2xl p-6 sm:p-7 shadow-2xl relative text-zinc-100 space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">
              {mode === 'login' ? 'Entrar no LiveShare' : 'Criar sua Conta'}
            </h3>
            <p className="text-xs text-zinc-400">
              {mode === 'login'
                ? 'Acesse com seu usuário para salvar suas salas e perfil'
                : 'Crie uma conta rápida para transmitir e jogar com amigos'}
            </p>
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#121522] p-1 rounded-xl border border-[#21273d]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Username */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-zinc-300">Usuário / Login</label>
            <div className="flex items-center gap-2 bg-[#141724] border border-[#22283c] rounded-xl px-3 py-2.5 focus-within:border-indigo-500 transition-colors">
              <User className="w-4 h-4 text-zinc-500" />
              <input
                id="input-auth-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: walace_gamer"
                autoCapitalize="none"
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Display Name (only in Register) */}
          {mode === 'register' && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-zinc-300">
                Nome de Exibição / Nickname
              </label>
              <div className="flex items-center gap-2 bg-[#141724] border border-[#22283c] rounded-xl px-3 py-2.5 focus-within:border-indigo-500 transition-colors">
                <Gamepad2 className="w-4 h-4 text-zinc-500" />
                <input
                  id="input-auth-displayname"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Walace Mendes"
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-zinc-300">Senha</label>
            <div className="flex items-center gap-2 bg-[#141724] border border-[#22283c] rounded-xl px-3 py-2.5 focus-within:border-indigo-500 transition-colors">
              <Lock className="w-4 h-4 text-zinc-500" />
              <input
                id="input-auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Avatar Color Picker (only in Register) */}
          {mode === 'register' && (
            <div className="space-y-1.5 text-left pt-1">
              <label className="text-xs font-semibold text-zinc-400">Cor do seu Perfil</label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      avatarColor === c
                        ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0c0e17]'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-auth-submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all active:scale-95 mt-2"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Criar Conta</span>
              </>
            )}
          </button>
        </form>

        {/* Guest Fast Entry Option */}
        <div className="pt-2 border-t border-[#1b2032] flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="text-xs font-medium text-zinc-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ou continuar rápido como <strong>Convidado</strong></span>
          </button>
        </div>
      </div>
    </div>
  );
};
