# Deploy em produção – vemnoquiz.com.br (Hostinger)

**Se o site não aparece ou dá 503:** use o guia **CORRIGIR-SITE.md** (passo a passo para corrigir).

Siga na ordem. Quando terminar, o site sobe sem 503.

---

## 1. Banco MySQL no painel

- **Bancos de dados** → **Gerenciamento** → criar banco e usuário (se ainda não criou).
- Banco atual do projeto: **u892594395_freelasmais** | usuário: **u892594395_mausfreelas**. Anote a senha e use no passo 4.

---

## 2. Tabelas no MySQL (opcional)

- O app **cria as tabelas automaticamente** ao subir (ensureDatabase). Não é obrigatório importar nada.
- Se quiser criar manualmente: **Bancos de dados** → **phpMyAdmin** → selecione o banco **u892594395_freelasmais** → Aba **Importar** → envie **database/schema.sql** (ou execute **database/schema-autocreate.sql** na aba SQL).

---

## 3. Node.js App

- **Websites** → **Add Website** → **Node.js Apps**.
- **Import Git Repository** → autorize o GitHub → repositório **developeragencia/maisfreelas**.
- **Build command:** `npm install --production` (ou o padrão).
- **Start command:** `npm start`.
- **Variáveis de ambiente** (obrigatório): adicione cada linha do arquivo **HOSTINGER_VARIAVEIS.txt** (ou cole o bloco, se o painel permitir).
- Clique em **Deploy**.

---

## 4. Variáveis de ambiente (obrigatório)

**Se /health-db mostrar "Access denied for user ''" ou "using password: NO"**, o servidor não está recebendo **DB_USER** e **DB_PASSWORD**. Defina-as no painel do Node.js App (Environment / Variáveis de ambiente). Sem isso, login e cadastro não funcionam.

No Node.js App, em **Environment** / **Variáveis**, deve ter:

| Nome | Valor |
|------|--------|
| PORT | 3000 |
| HOST | 0.0.0.0 |
| NODE_ENV | production |
| SESSION_SECRET | uma chave longa e aleatória (troque a do exemplo) |
| DB_HOST | localhost |
| DB_PORT | 3306 |
| DB_USER | (o usuário MySQL que você criou) |
| DB_PASSWORD | (a senha do usuário MySQL) |
| DB_NAME | (o nome do banco que você criou) |
| APP_URL | https://vemnoquiz.com.br |

---

## 5. Domínio

- No **Node.js App** que você criou: **Connect domain** / **Conectar domínio**.
- Selecione **vemnoquiz.com.br** como domínio **desse** app (não de outro site).

---

## 6. Conferir

- Acesse **https://vemnoquiz.com.br/health** → deve responder **ok**.
- Acesse **https://vemnoquiz.com.br** → deve abrir a home.
- **Se der 503:** (1) Faça **Redeploy** do Node.js App e espere 1–2 min. (2) Confira **Logs** do app: deve aparecer `MaisFreelas http://0.0.0.0:3000`. (3) Variáveis de ambiente (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) no painel. (4) **Conectar domínio** deve estar em **vemnoquiz.com.br** para este Node.js App.

---

**Resumo:** Banco criado + schema importado + Node.js App com variáveis + domínio conectado ao app = site no ar.
