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

  const domainUrl = 'https://live.walacemendes.com/dmg-live-share';
  const customRoomLink = `${domainUrl}/?room=${encodeURIComponent(currentRoomId)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0c0e18] border border-[#1f243a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-zinc-100">
        {/* Header */}
        <div className="p-5 border-b border-[#1f243a] flex items-center justify-between sticky top-0 bg-[#0c0e18]/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-800 text-indigo-400 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Deploy no Domínio <span className="text-indigo-400 font-mono">live.walacemendes.com/dmg-live-share</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Alternativa ao Discord Go Live pronta para jogar e assistir filmes juntos
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
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-indigo-200 text-sm">
                HTTPS & WebRTC Ativos
              </div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                O navegador exige conexão <strong>HTTPS (SSL)</strong> para permitir o compartilhamento de tela com captura de áudio estéreo do jogo/filme. A rota <strong>/dmg-live-share</strong> já está configurada tanto no servidor Node/Express quanto no Vite.
              </p>
            </div>
          </div>

          {/* Step by step */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Passo a Passo de Deploy
            </h3>

            {/* Step 1: Git Commit */}
            <div className="bg-[#121422] border border-[#21263c] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                  Commit e Push no Repositório Git
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">Git & Repo</span>
              </div>
              <p className="text-zinc-400 text-xs">
                No terminal do projeto, execute os comandos:
              </p>
              <div className="bg-black/60 border border-zinc-800/80 rounded-lg p-3 font-mono text-[11px] text-zinc-300 relative">
                <code>
                  git init<br />
                  git add .<br />
                  git commit -m "feat: login system and real webrtc screen share"<br />
                  git branch -M main<br />
                  git remote add origin https://github.com/SEU-USUARIO/dmg-live-share.git<br />
                  git push -u origin main
                </code>
                <button
                  onClick={() => copyToClipboard('git init && git add . && git commit -m "feat: login system and real webrtc screen share" && git branch -M main', 'git')}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                  title="Copiar comando"
                >
                  {copiedType === 'git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Step 2: Hosting / Server */}
            <div className="bg-[#121422] border border-[#21263c] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                  Build e Start no Servidor (VPS / Docker / Render)
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">Node.js</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                • <strong>Instalar dependências:</strong> <code className="bg-black/50 px-1 py-0.5 rounded text-indigo-300 font-mono">npm install</code><br />
                • <strong>Build de produção:</strong> <code className="bg-black/50 px-1 py-0.5 rounded text-indigo-300 font-mono">npm run build</code><br />
                • <strong>Iniciar servidor:</strong> <code className="bg-black/50 px-1 py-0.5 rounded text-indigo-300 font-mono">npm start</code>
              </p>
            </div>

            {/* Step 3: Nginx Reverse Proxy */}
            <div className="bg-[#121422] border border-[#21263c] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">3</span>
                  Configuração Nginx (Reverse Proxy & WebSocket)
                </div>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">live.walacemendes.com</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                No arquivo de configuração do seu Nginx (ex: <code>/etc/nginx/sites-available/live.walacemendes.com</code>):
              </p>

              <div className="bg-black/60 border border-zinc-800/80 rounded-lg p-3 font-mono text-[11px] text-zinc-300 relative">
                <pre className="overflow-x-auto">
{`location /dmg-live-share {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}`}
                </pre>
                <button
                  onClick={() => copyToClipboard('location /dmg-live-share {\n    proxy_pass http://localhost:3000;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection "upgrade";\n    proxy_set_header Host $host;\n    proxy_cache_bypass $http_upgrade;\n}', 'nginx')}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                  title="Copiar Nginx config"
                >
                  {copiedType === 'nginx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Share with custom domain */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0e101b] border border-indigo-800/50 rounded-xl p-4 space-y-2">
            <div className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Link direto para enviar aos amigos no WhatsApp / Discord:
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
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
