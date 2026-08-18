import React from 'react';
import { X, ShieldAlert, AlertTriangle, Scale, Ban, CheckCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="modal-terms"
        className="w-full max-w-lg bg-[#0c0e18] border border-[#1f243c] rounded-2xl p-6 sm:p-7 shadow-2xl relative text-zinc-100 space-y-5 max-h-[90vh] overflow-y-auto"
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
          <div className="w-12 h-12 rounded-xl bg-red-950/70 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">
              Diretrizes da Comunidade & Termos de Uso
            </h3>
            <p className="text-xs text-zinc-400">
              Segurança, Convivência e Conduta na Plataforma
            </p>
          </div>
        </div>

        {/* Severe Warning Notice */}
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>TOLERÂNCIA ZERO PARA VIOLAÇÕES</span>
          </div>
          <p className="text-xs text-red-200/90 leading-relaxed">
            Esta plataforma é destinada <strong>exclusivamente</strong> para compartilhamento de gameplays, jogos e filmes entre amigos e grupos. Qualquer uso indevido resultará em <strong>banimento permanente e imediato</strong> da conta Google e bloqueio de acesso.
          </p>
        </div>

        {/* Prohibited Content List */}
        <div className="space-y-3 text-xs">
          <div className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Ban className="w-4 h-4 text-red-400" />
            <span>É ESTRITAMENTE PROIBIDO TRANSMITIR OU COMPARTILHAR:</span>
          </div>

          <ul className="space-y-2 text-zinc-300 list-disc pl-5 leading-relaxed">
            <li>
              <strong className="text-red-400">Conteúdo Sexual ou Explícito:</strong> Pornografia, nudez, atos sexuais de qualquer natureza ou exploração.
            </li>
            <li>
              <strong className="text-red-400">Violência e Agressão:</strong> Cenas de violência física extrema, mutilação, tortura, crueldade com animais ou apologia ao crime.
            </li>
            <li>
              <strong className="text-red-400">Violação aos Direitos Humanos:</strong> Discurso de ódio, racismo, homofobia, assédio, ameaças, discriminação ou perseguição de qualquer tipo.
            </li>
            <li>
              <strong className="text-red-400">Conduta Sem Escrúpulos & Ilícita:</strong> Vazamento de dados pessoais (doxxing), atividades ilegais, fraudes ou invasão de privacidade.
            </li>
          </ul>
        </div>

        {/* Enforcement Section */}
        <div className="p-3.5 bg-[#121422] border border-[#21263c] rounded-xl flex items-start gap-3 text-xs text-zinc-400">
          <Scale className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-200">Moderação e Aplicação de Regras:</span>
            <p className="mt-1 leading-relaxed text-[11px]">
              Contas que descumprirem estas regras serão banidas sem aviso prévio. A plataforma reserva-se o direito de cooperar com autoridades competentes em casos de violação da legislação aplicável.
            </p>
          </div>
        </div>

        {/* Accept Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Compreendo e Concordo com as Diretrizes</span>
        </button>
      </div>
    </div>
  );
};
