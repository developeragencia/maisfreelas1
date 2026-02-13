# Deploy em produção – vemnoquiz.com.br (Hostinger)

Siga na ordem. Quando terminar, o site sobe sem 503.

---

## 1. Banco MySQL no painel

- **Bancos de dados** → **Gerenciamento** → criar banco e usuário (se ainda não criou).
- Anote: nome do banco, usuário, senha (use os que estão no passo 3).

---

## 2. Tabelas no MySQL

- **Bancos de dados** → **phpMyAdmin**.
- Selecione o banco **u892594395_maisfreelas2**.
- Aba **Importar** → envie o arquivo **database/schema.sql** do projeto (ou copie o conteúdo e execute na aba SQL).

---

## 3. Node.js App

- **Websites** → **Add Website** → **Node.js Apps**.
- **Import Git Repository** → autorize o GitHub → repositório **developeragencia/maisfreelas**.
- **Build command:** `npm install --production` (ou o padrão).
- **Start command:** `npm start`.
- **Variáveis de ambiente** (obrigatório): adicione cada linha do arquivo **HOSTINGER_VARIAVEIS.txt** (ou cole o bloco, se o painel permitir).
- Clique em **Deploy**.

---

## 4. Variáveis de ambiente (conferir)

No Node.js App, em **Environment** / **Variáveis**, deve ter:

| Nome | Valor |
|------|--------|
| PORT | 3000 |
| NODE_ENV | production |
| SESSION_SECRET | uma chave longa e aleatória (troque a do exemplo) |
| DB_HOST | 127.0.0.1 |
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
- Se ainda der 503: confira **Logs** do Node.js App e **Resources Usage** (limites de CPU/RAM/disco).

---

**Resumo:** Banco criado + schema importado + Node.js App com variáveis + domínio conectado ao app = site no ar.
