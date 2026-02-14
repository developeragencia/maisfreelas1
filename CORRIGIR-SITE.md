# Site não aparece / 503 – Faça exatamente isto

Siga **na ordem**. Se pular um passo, o site continua fora.

---

## 1. Na Hostinger: Node.js App

- **Websites** → clique no site **vemnoquiz.com.br** → **Node.js** (ou **Aplicações Node.js**).
- Se **não existir** um Node.js App para este domínio: **Criar aplicação** / **Add Node.js App**.
- **Domínio:** selecione ou digite **vemnoquiz.com.br** (só este app deve usar este domínio).

---

## 2. Build e comando de início (não confundir)

Na Hostinger existem **dois campos diferentes**. Se você colocar o comando de **início** no lugar do **build**, a implantação falha com "Falha na construção".

| Campo | Onde fica | O que colocar |
|-------|-----------|----------------|
| **Build command** / Comando de compilação | Configurações de build | **Só** `npm install` ou `npm install --production` |
| **Start command** / Comando de início | Configurações do app | `npm start` **ou** `node server-bootstrap.js` |

- **Build command:** deve **terminar** (só instala pacotes). **Não** coloque `npm start` aqui.
- **Start command:** é o que **sobe o servidor**. Use **um** destes (exatamente):
  - `npm start`
  - ou `node server-bootstrap.js`

**Não** use só `node server.js` (o bootstrap evita 503 quando algo falha).

---

## 3. Variáveis de ambiente (obrigatório)

No mesmo Node.js App: **Variáveis de ambiente** / **Environment variables**.

Adicione **uma por uma** (nome e valor):

| Nome            | Valor                    |
|-----------------|--------------------------|
| PORT            | 3000                     |
| HOST            | 0.0.0.0                  |
| NODE_ENV        | production               |
| SESSION_SECRET  | (uma chave longa qualquer; pode copiar do .env) |
| DB_HOST         | localhost                |
| DB_PORT         | 3306                     |
| DB_USER         | u892594395_mausfreelas   |
| DB_PASSWORD     | (a senha do MySQL que você definiu no painel)  |
| DB_NAME         | u892594395_freelasmais   |
| APP_URL         | https://vemnoquiz.com.br |

**Importante:** sem **DB_USER**, **DB_PASSWORD** e **DB_NAME** corretos, login e cadastro não funcionam. Na Hostinger use **DB_HOST=localhost** (não 127.0.0.1).

---

## 4. Conectar o domínio ao Node.js App

- No Node.js App: **Domínio** / **Connect domain** / **Conectar domínio**.
- Selecione **vemnoquiz.com.br** e confirme que está **vinculado a este** Node.js App (e não a outro site estático/PHP).

---

## 5. Deploy e reinício

- **Build command** (só este campo): `npm install` ou `npm install --production`. Deixe o **Start command** no outro campo (passo 2).
- Clique em **Deploy** (ou **Redeploy**).
- Depois do deploy, clique em **Reiniciar** / **Restart** no Node.js App.
- Espere **1–2 minutos**.
- **Se aparecer "Falha na construção":** confira se no **Build command** está só `npm install` (ou `npm install --production`). Se estiver `npm start` ou `node server-bootstrap.js` no build, mude para `npm install` e salve de novo.

---

## 6. Conferir

1. **https://vemnoquiz.com.br/health**  
   - Deve aparecer só: **ok**  
   - Se não abrir ou der 503: veja o passo 7.

2. **https://vemnoquiz.com.br**  
   - Deve abrir a home do MaisFreelas.

3. **https://vemnoquiz.com.br/health-db**  
   - Se aparecer `"ok": true` → banco OK.  
   - Se aparecer `"ok": false` → confira as variáveis no painel (passo 3). Use **DB_HOST=localhost** (na Hostinger MySQL local é localhost).

**Se cadastro ou login mostrar "Banco de dados indisponível":**  
- Acesse **/health-db** e veja a mensagem e o **hint**.  
- No painel do Node.js App, confira **DB_HOST=localhost**, **DB_USER**, **DB_PASSWORD** e **DB_NAME** (exatamente como no painel de Bancos de dados).  
- Salve as variáveis e clique em **Reiniciar** no Node.js App.

---

## 7. Se ainda der 503 ou o site não abrir

- Abra **Logs** do Node.js App na Hostinger.
- Procure por:
  - **`MaisFreelas http://0.0.0.0:3000`** → app subiu; se o site não abrir, o problema é domínio/proxy (passo 4).
  - **`Servidor mínimo em http://...`** → o app principal falhou ao carregar; no log deve aparecer **`[Falha ao carregar server.js]`** e o motivo.
  - **Nada disso** → o Node pode não estar rodando; confira o **comando de início** (passo 2) e faça **Redeploy** de novo.

---

**Resumo:** Build = `npm install` | Início = `npm start` ou `node server-bootstrap.js` + variáveis de ambiente + domínio conectado a este Node.js App + Deploy e Restart = site no ar.
