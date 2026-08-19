import React from 'react';
import { X, ShieldAlert, AlertTriangle, Scale, Ban, CheckCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans">
      <div
        id="modal-terms"
        className="w-full max-w-lg bg-[#0c0e17] border border-[#1e2338] rounded-3xl p-6 sm:p-7 shadow-2xl relative text-zinc-100 space-y-5 max-h-[90vh] overflow-y-auto"
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
          <div className="w-12 h-12 rounded-2xl bg-red-950/70 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Diretrizes da Comunidade & Termos de Uso
            </h3>
            <p className="text-xs text-zinc-400">
              Normas de segurança, convivência e respeito na plataforma
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-red-950/30 border border-red-800/60 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Conduta na Plataforma</span>
          </div>
          <p className="text-xs text-red-200/90 leading-relaxed">
            Esta plataforma é destinada <strong>exclusivamente</strong> para compartilhamento de gameplays, jogos e filmes entre amigos e grupos. Qualquer conduta indevida resultará em <strong>bloqueio permanente da conta Google</strong> e remoção de acesso.
          </p>
        </div>

        {/* Prohibited Content List */}
        <div className="space-y-3 text-xs">
          <div className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Ban className="w-4 h-4 text-red-400" />
            <span>É estritamente proibido transmitir ou compartilhar:</span>
          </div>

          <ul className="space-y-2 text-zinc-300 list-disc pl-5 leading-relaxed">
            <li>
              <strong className="text-red-400">Conteúdo Sexual ou Explícito:</strong> Pornografia, nudez, atos sexuais de qualquer natureza ou exploração.
            </li>
            <li>
              <strong className="text-red-400">Violência e Agressão:</strong> Cenas de violência física extrema, crueldade ou apologia ao crime.
            </li>
            <li>
              <strong className="text-red-400">Violação aos Direitos Humanos:</strong> Discurso de ódio, racismo, homofobia, assédio, ameaças ou perseguição de qualquer tipo.
            </li>
            <li>
              <strong className="text-red-400">Vazamento de Dados (Doxxing):</strong> Exposição de informações pessoais de terceiros sem consentimento.
            </li>
          </ul>
        </div>

        {/* Enforcement Section */}
        <div className="p-3.5 bg-[#121524] border border-[#20253c] rounded-2xl flex items-start gap-3 text-xs text-zinc-400">
          <Scale className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-200">Moderação Ativa:</span>
            <p className="mt-1 leading-relaxed text-[11px]">
              Contas que descumprirem as regras serão desconectadas e suspensas imediatamente.
            </p>
          </div>
        </div>

        {/* Accept Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Compreendo e Concordo com as Diretrizes</span>
        </button>
      </div>
    </div>
  );
};
