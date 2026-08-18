# 🔐 Guia: Autenticação Exclusiva com Conta Google (Google Sign-In)

> **Domínio:** `https://live.walacemendes.com.br`  
> **Repositório:** `https://github.com/ualasimendes/DMG-GOLIVE`  

---

## ⚡ Como Funciona a Autenticação Google

O **DMG Live Share** agora utiliza **exclusivamente autenticação com Conta Google (Google OAuth 2.0 / Google Identity Services)**:

- 🚀 **1-Click Sign-In**: Login instantâneo com foto de perfil e nome do Google.
- 🛡️ **Segurança Total**: Sem necessidade de gerenciar senhas no banco.
- 📧 **E-mail Verificado**: Todos os participantes têm identidade verificada.

---

## 🛠️ (Opcional) Como Criar seu Próprio Google Client ID

O app já vem pronto para funcionar. Se você quiser criar seu próprio ID de Cliente oficial no painel do Google Cloud para exibir o nome **"DMG Live Share"** na tela de autorização:

### Passo 1: Acessar o Google Cloud Console
1. Acesse **[console.cloud.google.com](https://console.cloud.google.com)**.
2. Crie um novo projeto (ex: `DMG Live Share`).

### Passo 2: Configurar a Tela de Consentimento OAuth
1. Vá em **APIs e Serviços** ➔ **Tela de permissão OAuth** (OAuth consent screen).
2. Escolha **Externo (External)** e clique em Criar.
3. Preencha:
   - **Nome do app:** `DMG Live Share`
   - **E-mail de suporte:** seu e-mail
   - **Domínio autorizado:** `walacemendes.com.br` e `onrender.com`
4. Salve e avance até o final.

### Passo 3: Criar as Credenciais (ID do Cliente)
1. Vá em **Credenciais** ➔ **Criar Credenciais** ➔ **ID do cliente OAuth**.
2. Tipo de aplicativo: **Aplicativo da Web (Web application)**.
3. **Origens JavaScript autorizadas (Authorized JavaScript origins):**
   - `https://live.walacemendes.com.br`
   - `https://dmg-golive.onrender.com`
   - `http://localhost:3000`
4. **URIs de redirecionamento autorizados:**
   - `https://live.walacemendes.com.br`
   - `https://dmg-golive.onrender.com`
5. Clique em **Criar** e copie o **Client ID** gerado (ex: `123456789-abc.apps.googleusercontent.com`).

---

## ⚙️ Como Ativar no Render

No painel do **Render.com** ➔ seu serviço ➔ **Environment**:
- Adicione a variável:
  - **Key:** `VITE_GOOGLE_CLIENT_ID`
  - **Value:** `SEU_GOOGLE_CLIENT_ID_AQUI`
