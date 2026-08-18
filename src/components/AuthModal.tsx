import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertCircle, X } from 'lucide-react';
import { AuthUser } from '../types';
import { getApiBaseUrl } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, token: string) => void;
}

// Official Google Client ID for DMG Live Share (live.walacemendes.com.br)
const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '986855077085-ba6jsg0nkt7s3oj78mersmgqard7usqg.apps.googleusercontent.com';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      if (!response.credential) {
        throw new Error('Nenhuma credencial retornada pelo Google.');
      }

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao autenticar com a conta Google.');
      }

      localStorage.setItem('dmg_auth_token', data.token);
      localStorage.setItem('dmg_auth_user', JSON.stringify(data.user));

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGooglePrompt = () => {
    setError(null);
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id && googleBtnRef.current) {
        clearInterval(interval);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
          });

          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
        } catch (err) {
          console.warn('Google GSI initialization notice:', err);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="modal-auth"
        className="w-full max-w-md bg-[#0c0e17] border border-[#1f2438] rounded-2xl p-6 sm:p-8 shadow-2xl relative text-zinc-100 space-y-6 text-center"
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
        <div className="flex flex-col items-center pt-2">
          {/* Google Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-white p-3 shadow-xl flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-extrabold text-zinc-100">
            Acesse com sua Conta Google
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Faça login com sua conta oficial do Google para criar salas e transmitir sua gameplay.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Official Google Button Container */}
        <div className="space-y-3 flex flex-col items-center justify-center w-full py-1">
          <div ref={googleBtnRef} className="flex justify-center min-h-[44px] w-full" />

          {/* Backup trigger button */}
          <button
            type="button"
            id="btn-google-login-oauth"
            onClick={handleTriggerGooglePrompt}
            disabled={loading}
            className="w-full max-w-[320px] py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm rounded-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Fazer Login com o Google</span>
              </>
            )}
          </button>
        </div>

        {/* Security & Features footer */}
        <div className="pt-3 border-t border-[#1b2032] flex flex-col items-center gap-1 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autenticação Oficial Google OAuth 2.0</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Acesso verificado e seguro.
          </p>
        </div>
      </div>
    </div>
  );
};
