# 🚀 Guia de Deploy — DMG Live Share (DMG-GOLIVE)
**Domínio:** `https://live.walacemendes.com.br`  
**Site Principal:** `https://walacemendes.com.br`  
**Repositório GitHub:** `https://github.com/ualasimendes/DMG-GOLIVE`

---

## 1. Visão Geral

Este projeto é uma alternativa de alto desempenho ao **Discord Go Live**, permitindo transmitir gameplay e filmes em 1080p 60 FPS com som estéreo do sistema/jogo, microfone e chat em tempo real via **WebRTC P2P**.

O projeto faz parte do ecossistema do seu portfólio em **walacemendes.com.br** e é acessado através do subdomínio **`live.walacemendes.com.br`** ou link na sua **Aba Projetos**.

---

## 2. Passo a Passo para Enviar ao GitHub (`ualasimendes/DMG-GOLIVE`)

No terminal da pasta do projeto:

```bash
# 1. Configurar o repositório remoto oficial
git remote add origin https://github.com/ualasimendes/DMG-GOLIVE.git

# 2. Adicionar arquivos e fazer commit
git add .
git commit -m "feat: login system, real WebRTC screen share and live.walacemendes.com.br setup"

# 3. Enviar para a branch main
git branch -M main
git push -u origin main
```

---

## 3. Configuração de DNS (`live.walacemendes.com.br`)

No painel onde gerencia o DNS de `walacemendes.com.br` (Registro.br, Cloudflare ou Hostinger):

| Tipo | Nome (Host) | Destino / Valor | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `live` | `seu-app.onrender.com` (ou IP da VPS em registro A) | Auto |

---

## 4. Deploy em VPS (Ubuntu com Nginx & PM2)

### A. Clonar e Compilar no Servidor
```bash
git clone https://github.com/ualasimendes/DMG-GOLIVE.git
cd DMG-GOLIVE

npm install
npm run build

npm install -g pm2
pm2 start dist/server.cjs --name "dmg-golive"
pm2 save
pm2 startup
```

### B. Configuração do Nginx (`/etc/nginx/sites-available/live.walacemendes.com.br`)
```nginx
server {
    server_name live.walacemendes.com.br;

    location / {
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

    listen 80;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/live.walacemendes.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d live.walacemendes.com.br
```

---

## 5. Deploy em Plataformas Gratuitas (Render / Railway)

1. No [Render.com](https://render.com) ou [Railway.app](https://railway.app), conecte o repositório `ualasimendes/DMG-GOLIVE`.
2. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Em **Custom Domains**, adicione `live.walacemendes.com.br`.
4. No Registro.br/Cloudflare, aponte o CNAME `live` para o endereço do Render.
