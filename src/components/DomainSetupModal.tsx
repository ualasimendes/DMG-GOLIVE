import React, { useState } from 'react';
import {
  Globe,
  Server,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Zap,
  HelpCircle,
  ArrowRight,
  FolderGit2,
} from 'lucide-react';
import { getShareableRoomUrl } from '../utils/api';

interface DomainSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
}

export const DomainSetupModal: React.FC<DomainSetupModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const domainUrl = 'https://live.walacemendes.com.br';
  const customRoomLink = getShareableRoomUrl(currentRoomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-[#0c0e18] border border-[#1f243a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-zinc-100">
        {/* Header */}
        <div className="p-5 border-b border-[#1f243a] flex items-center justify-between sticky top-0 bg-[#0c0e18]/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-800 text-indigo-400 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Tutorial: Subdomínio <span className="text-indigo-400 font-mono">live.walacemendes.com.br</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Integrado como um projeto do seu site oficial <span className="text-zinc-300 font-medium">walacemendes.com.br</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs text-zinc-300">
          {/* Top Banner Notice */}
          <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-4 flex items-start gap-3">
            <FolderGit2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-indigo-200 text-sm">
                Projeto Integrado na sua "Aba Projetos"
              </div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                O <strong>DMG-GOLIVE</strong> é um módulo do seu site principal. Seu site institucional continua em <code>walacemendes.com.br</code> e você adiciona o card na aba de projetos abrindo <code>live.walacemendes.com.br</code> com WebRTC 60 FPS, microfone e chat ao vivo.
              </p>
            </div>
          </div>

          {/* Step by step */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Passo a Passo Rápido
            </h3>

            {/* Step 1: GitHub Push */}
            <div className="bg-[#121422] border border-[#21263c] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                  Enviar para o Repositório GitHub
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">ualasimendes/DMG-GOLIVE</span>
              </div>
              <p className="text-zinc-400 text-xs">
                No terminal do projeto, envie o código para seu repositório:
              </p>
              <div className="bg-black/60 border border-zinc-800/80 rounded-lg p-3 font-mono text-[11px] text-zinc-300 relative">
                <code>
                  git remote add origin https://github.com/ualasimendes/DMG-GOLIVE.git<br />
                  git push -u origin main
                </code>
                <button
                  onClick={() => copyToClipboard('git remote add origin https://github.com/ualasimendes/DMG-GOLIVE.git\ngit push -u origin main', 'git')}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                  title="Copiar comando"
                >
                  {copiedType === 'git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Step 2: DNS Config */}
            <div className="bg-[#121422] border border-[#21263c] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                  Cadastrar Registro CNAME no DNS (Registro.br / Cloudflare / Hostinger)
                </div>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">live.walacemendes.com.br</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Na zona DNS do domínio <strong>walacemendes.com.br</strong>, adicione:
              </p>

              {/* DNS Table Example */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-zinc-800 rounded-lg overflow-hidden font-mono text-[11px]">
                  <thead className="bg-zinc-800/80 text-zinc-300">
                    <tr>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Nome (Host)</th>
                      <th className="p-2">Destino / Valor</th>
                      <th className="p-2">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-950/70 text-zinc-300">
                    <tr>
                      <td className="p-2 font-bold text-blue-400">CNAME</td>
                      <td className="p-2 font-bold text-zinc-100">live</td>
                      <td className="p-2 text-indigo-300">seu-app.onrender.com (ou IP da VPS em registro A)</td>
                      <td className="p-2 text-zinc-500">Auto</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3: Aba Projetos */}
            <div className="bg-[#121422] border border-[#21263c] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">3</span>
                  Card na Aba Projetos do seu Site Principal
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">Portfólio</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                No site principal (<code>walacemendes.com.br</code>), crie um card apontando o botão para:
              </p>
              <div className="p-2.5 bg-black/60 border border-zinc-800 rounded-lg font-mono text-indigo-300 flex items-center justify-between">
                <span>https://live.walacemendes.com.br</span>
                <button
                  onClick={() => copyToClipboard('https://live.walacemendes.com.br', 'main-link')}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Copiar URL"
                >
                  {copiedType === 'main-link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Share with custom domain */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0e101b] border border-indigo-800/50 rounded-xl p-4 space-y-2">
            <div className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Link direto da sua sala para amigos:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={customRoomLink}
                className="flex-1 bg-zinc-950 border border-zinc-800 font-mono text-xs text-indigo-300 px-3 py-2 rounded-lg"
              />
              <button
                onClick={() => copyToClipboard(customRoomLink, 'link')}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 font-medium transition-colors"
              >
                {copiedType === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1f243a] flex justify-end bg-[#0c0e18] sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium text-xs transition-colors"
          >
            Fechar Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};
