# 🎮 DMG Live Share (DMG-GOLIVE) — Alternativa ao Discord Go Live

> Compartilhamento de tela P2P em tempo real com áudio estéreo de jogos e filmes, microfone e chat ao vivo para você e seus amigos.
> **Integrado ao portfólio:** [walacemendes.com.br](https://walacemendes.com.br)
> **Subdomínio:** [live.walacemendes.com.br](https://live.walacemendes.com.br)
> **Repositório oficial:** [ualasimendes/DMG-GOLIVE](https://github.com/ualasimendes/DMG-GOLIVE)

---

## ✨ Funcionalidades

- **Zero Mock / 100% Real-Time**: WebRTC mesh com sinalização via WebSocket para compartilhamento de tela e áudio do sistema sem delay (< 20ms).
- **Sistema de Autenticação Completo**:
  - Cadastro de usuário com senha segura (PBKDF2 com Salt e tokens assinados).
  - Login persistente via `localStorage` e verificação de token `/api/auth/me`.
  - Modo Convidado rápido ("Entrar como Convidado") para acesso instantâneo sem cadastro.
  - Edição de perfil com cor do avatar, nome de exibição e foto personalizada.
- **Transmissão Gamer & Filmes em Alta Resolução**:
  - Suporte a 720p, 1080p e 1440p @ 60 FPS com áudio estéreo cristalino.
  - Alternador de streamers: se 2 ou mais pessoas compartilharem tela, alterne entre elas com 1 clique.
  - Modo Picture-in-Picture (PiP), Tela Cheia e Captura de Screenshot da gameplay.
  - Indicador de quem está falando (borda verde iluminada por detecção de áudio).
- **Integrado na Aba Projetos**:
  - Link de navegação de volta para o site principal [walacemendes.com.br](https://walacemendes.com.br).

---

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti
- **WebRTC & Áudio**: WebRTC PeerConnection, AudioContext Synthesizer & Level Detector
- **Backend**: Node.js, Express, WebSocket (`ws`), WebRTC Signaling Relay, Crypto Auth
- **Bundler & Server**: Vite 6, esbuild

---

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em modo de desenvolvimento
npm run dev

# Acesse no navegador:
# http://localhost:3000
```

---

## 📦 Build e Produção

```bash
# Compilar frontend e backend
npm run build

# Iniciar servidor de produção
npm start
```

Consulte os tutoriais detalhados:
- [TUTORIAL_DOMINIO.md](file:///C:/Users/walac/Downloads/TONS%20OF%20DAMAGE%20-%20LIVE%20SHARE/TUTORIAL_DOMINIO.md): Tutorial de DNS para `live.walacemendes.com.br` e integração na Aba Projetos.
- [DEPLOY.md](file:///C:/Users/walac/Downloads/TONS%20OF%20DAMAGE%20-%20LIVE%20SHARE/DEPLOY.md): Guia de deploy em VPS com Nginx e SSL ou plataformas Cloud (Render/Railway).
