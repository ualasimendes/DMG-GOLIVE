# 🚀 Guia de Deploy — LiveShare Play (DMG Live Share)
**Domínio:** `https://live.walacemendes.com/dmg-live-share`

---

## 1. Visão Geral

Este projeto é uma alternativa de alta fidelidade ao **Discord Go Live**, permitindo compartilhar tela com áudio estéreo do jogo/filme, microfone e chat em tempo real via **WebRTC P2P** com latência ultrabaixa (< 20ms).

### Recursos Implementados:
- ✅ **Sistema de Autenticação Real** (Login, Cadastro com hash PBKDF2/Salt, Sessões seguras com Token, Perfil personalizável e Modo Convidado).
- ✅ **Remoção de todo Mock/Simulação** (Participantes reais, Chat via WebSocket, WebRTC real com captura de tela e áudio do sistema).
- ✅ **Suporte nativo a sub-rota**: funciona tanto em `/dmg-live-share` quanto na raiz `/`.
- ✅ **Stage de alta performance** com controles de volume individual, captura de print/snapshot, PiP e alternador de múltiplas telas.

---

## 2. Passo a Passo para Commit no Git

No terminal do projeto (na pasta onde os arquivos estão):

```bash
# 1. Inicializar repositório Git
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Criar commit inicial
git commit -m "feat: login system, real WebRTC screen share, and deploy config for live.walacemendes.com/dmg-live-share"

# 4. Renomear branch para main
git branch -M main

# 5. Adicionar repositório remoto do GitHub
git remote add origin https://github.com/SEU_USUARIO_GITHUB/dmg-live-share.git

# 6. Enviar arquivos
git push -u origin main
```

---

## 3. Deploy em VPS (Ubuntu / Debian com Nginx & PM2)

### A. Clonar e Compilar no Servidor
```bash
# Clonar repositório
git clone https://github.com/SEU_USUARIO_GITHUB/dmg-live-share.git
cd dmg-live-share

# Instalar dependências
npm install

# Gerar build de produção do frontend e backend
npm run build

# Iniciar com PM2 para rodar 24/7
npm install -g pm2
pm2 start dist/server.cjs --name "dmg-live-share"
pm2 save
pm2 startup
```

### B. Configuração do Nginx para `live.walacemendes.com`
Crie ou edite o arquivo em `/etc/nginx/sites-available/live.walacemendes.com`:

```nginx
server {
    server_name live.walacemendes.com;

    # Sub-rota /dmg-live-share
    location /dmg-live-share {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket direto
    location /dmg-live-share/ws {
        proxy_pass http://localhost:3000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Raiz opcional redirecionando para a aplicação
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 80;
}
```

Ative a configuração e recarregue o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/live.walacemendes.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### C. Certificado SSL Gratuito (Certbot HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d live.walacemendes.com
```

---

## 4. Deploy em Serviços Gratuitos / Cloud (Render / Railway)

1. Crie uma conta no **[Render.com](https://render.com)** ou **[Railway.app](https://railway.app)**.
2. Clique em **"New Web Service"** e conecte seu repositório do GitHub.
3. Configure os comandos:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `NODE_ENV`: `production`
     - `PORT`: `3000`
     - `JWT_SECRET`: `sua-chave-secreta-forte-aqui`
     - `VITE_BASE_PATH`: `/dmg-live-share/` (ou `./`)
4. Em **Custom Domains**, adicione `live.walacemendes.com`.
5. No seu painel DNS (GoDaddy, Cloudflare ou Registro.br):
   - Adicione registro **CNAME** com Nome `live` apontando para o endereço fornecido pelo Render/Railway.

---

## 5. Variáveis de Ambiente (.env)

Crie um arquivo `.env` para personalizar as configurações do servidor:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=super_secret_jwt_key_walace_share_2026
VITE_BASE_PATH=/dmg-live-share/
```
