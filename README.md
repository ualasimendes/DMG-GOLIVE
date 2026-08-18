# 🎮 LiveShare Play — DMG Live Share (Alternativa Discord Go Live)

> Compartilhamento de tela P2P em tempo real com áudio estéreo de jogos e filmes, microfone e chat ao vivo para você e seus amigos.

---

## ✨ Funcionalidades

- **Zero Mock / 100% Real-Time**: WebRTC mesh com sinalização via WebSocket para compartilhamento de tela e áudio do sistema sem delay (< 20ms).
- **Sistema de Autenticação Completo**:
  - Cadastro de usuário com senha segura (PBKDF2 com Salt e tokens assinados).
  - Login persistente via `localStorage` e verificação de token `/api/auth/me`.
  - Modo Convidado rápido ("Entrar como Convidado") para acesso instantâneo sem cadastro.
  - Edição de perfil com cor do avatar, nome de exibição e foto personalizada.
- **Transmissão Gamer & Filmes em Alta Resolução**:
  - Suporte a 720p, 1080p e 1440p @ 60 FPS com áudio cristalino.
  - Alternador de streamers: se 2 ou mais pessoas compartilharem tela, alterne entre elas com 1 clique.
  - Modo Picture-in-Picture (PiP), Tela Cheia e Captura de Screenshot da gameplay.
  - Indicador de quem está falando (borda verde iluminada por detecção de áudio).
- **Pronto para Deploy no Domínio**:
  - Configurado para `live.walacemendes.com/dmg-live-share`.

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
# ou http://localhost:3000/dmg-live-share
```

---

## 📦 Build e Produção

```bash
# Compilar frontend e backend
npm run build

# Iniciar servidor de produção
npm start
```

Consulte o arquivo [DEPLOY.md](file:///C:/Users/walac/Downloads/TONS%20OF%20DAMAGE%20-%20LIVE%20SHARE/DEPLOY.md) para o guia detalhado de deploy no seu domínio `live.walacemendes.com/dmg-live-share`.
