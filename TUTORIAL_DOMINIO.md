# 🌐 Tutorial Completo: Configuração do Domínio `live.walacemendes.com.br` & Integração na Aba Projetos

> **Projeto:** DMG Live Share (DMG-GOLIVE)  
> **Repositório GitHub:** `https://github.com/ualasimendes/DMG-GOLIVE`  
> **Domínio do App:** `https://live.walacemendes.com.br`  
> **Site Principal / Portfólio:** `https://walacemendes.com.br`  

---

## 📌 1. Visão Geral da Arquitetura

O **DMG-GOLIVE** é um subprojeto que faz parte do ecossistema do seu site principal (**walacemendes.com.br**). 

Ao invés de substituir seu site, ele roda como uma aplicação independente de alta performance:
- **Site Principal:** `https://walacemendes.com.br` (sua página institucional, portfólio e aba de projetos).
- **Subdomínio do App:** `https://live.walacemendes.com.br` (onde roda o WebRTC, tela 60 FPS, chat e login).
- **Na sua Aba Projetos:** Você adiciona um card/botão de destaque que abre o aplicativo para amigos e visitantes testarem.

---

## ⚙️ 2. Como Criar o Subdomínio `live.walacemendes.com.br` no DNS

Onde você gerencia o DNS de `walacemendes.com.br` (Registro.br, Cloudflare, Hostinger ou cPanel), você precisa apenas adicionar **1 registro CNAME**:

### 🔹 Opção A: No Cloudflare (Recomendado)
1. Acesse o painel da [Cloudflare](https://dash.cloudflare.com) e selecione o domínio `walacemendes.com.br`.
2. Vá em **DNS** ➔ **Records** ➔ **Add Record**.
3. Preencha os campos:
   - **Type:** `CNAME`
   - **Name (Host):** `live`
   - **Target (Destino):** O endereço do seu servidor (ex: `seu-app.onrender.com` ou o domínio da VPS).
   - **Proxy status:** *DNS only* (nuvem cinza) ou *Proxied* (nuvem laranja). *A Cloudflare suporta WebSockets nativamente.*
   - **TTL:** `Auto`.
4. Clique em **Save**.

---

### 🔹 Opção B: No Registro.br
1. Acesse [registro.br](https://registro.br) e faça login.
2. Clique no domínio **`walacemendes.com.br`**.
3. Role até a seção **DNS** e clique em **Editar Zona** (ou *Modificar Servidores de DNS* se gerenciar na própria zona do Registro.br).
4. Clique em **Nova Entrada**:
   - **Tipo:** `CNAME`
   - **Nome:** `live`
   - **Valor:** O endereço do seu serviço no Render/Railway (ex: `dmg-golive.onrender.com.`).
5. Clique em **Salvar**.

---

### 🔹 Opção C: Na Hostinger / cPanel / GoDaddy
1. Vá na seção **Editor de Zona DNS**.
2. Clique em **Adicionar Registro**:
   - **Tipo:** `CNAME`
   - **Host / Nome:** `live`
   - **Aponta para:** `dmg-golive.onrender.com` (ou o IP da sua VPS como registro `A`).
   - **TTL:** `300` ou `14400`.
3. Salve as alterações.

---

## 💻 3. Como Integrar o Projeto na "Aba Projetos" do seu Site Principal

No código do seu site principal (`walacemendes.com.br`), dentro da seção de **Projetos**, adicione o card do **DMG Live Share**.

### Exemplo em React / Tailwind CSS:
```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
  <div className="flex items-center justify-between mb-4">
    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl font-bold">
      🎮
    </div>
    <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold animate-pulse">
      ● AO VIVO
    </span>
  </div>

  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
    DMG Live Share (Alternativa Discord Go Live)
  </h3>
  <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
    Compartilhamento de tela em 1080p 60 FPS com áudio estéreo do jogo, microfone e chat em tempo real via WebRTC.
  </p>

  <div className="flex flex-wrap gap-2 mt-4">
    <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">React 19</span>
    <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">WebRTC</span>
    <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">WebSocket</span>
    <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">Node.js</span>
  </div>

  <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/80">
    <a
      href="https://live.walacemendes.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
    >
      <span>Abrir Aplicativo</span>
      <span>➔</span>
    </a>
    <a
      href="https://github.com/ualasimendes/DMG-GOLIVE"
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-zinc-400 hover:text-white font-mono transition-colors"
    >
      Ver no GitHub
    </a>
  </div>
</div>
```

---

## 🖥️ 4. Configuração do Servidor VPS / Nginx (Se hospedar em VPS própria)

Caso o seu site principal e o subdomínio estejam na mesma VPS:

### Arquivo Nginx para o subdomínio `/etc/nginx/sites-available/live.walacemendes.com.br`:
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

### Gerar SSL Grátis (HTTPS):
```bash
sudo certbot --nginx -d live.walacemendes.com.br
```

---

## 🚀 5. Comandos para Enviar o Código ao GitHub

No seu terminal do VS Code / pasta do projeto:

```bash
# 1. Configurar o repositório remoto
git remote add origin https://github.com/ualasimendes/DMG-GOLIVE.git

# 2. Enviar os arquivos para a branch main
git push -u origin main --force
```

Tudo pronto! O app agora está configurado para operar como um projeto integrado do seu domínio oficial `walacemendes.com.br`.
