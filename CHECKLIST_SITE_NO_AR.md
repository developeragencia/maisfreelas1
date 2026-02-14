# Checklist – site no ar em vemnoquiz.com.br

Marque cada item depois de fazer. Quando todos estiverem ok, o site aparece e funciona.

---

## Banco de dados

- [ ] No painel Hostinger: **Bancos de dados** → **Gerenciamento** → criou banco e usuário:
  - Banco: **u892594395_freelasmais**
  - Usuário: **u892594395_mausfreelas**
  - Senha: (a que você definiu no painel)
- [ ] (Opcional) O app cria as tabelas automaticamente ao subir. Se quiser importar manualmente: **phpMyAdmin** → banco **u892594395_freelasmais** → **Importar** → **database/schema.sql**.

---

## Node.js App na Hostinger

- [ ] **Websites** → **Add Website** → **Node.js Apps**.
- [ ] **Import Git Repository** → GitHub → repositório **developeragencia/maisfreelas**.
- [ ] **Build command:** `npm install --production` (ou o que o painel sugerir).
- [ ] **Start command:** `npm start`.
- [ ] **Variáveis de ambiente:** colou **todas** as linhas do arquivo **HOSTINGER_VARIAVEIS.txt** (ou adicionou cada variável no painel).
- [ ] Clicou em **Deploy** e o deploy terminou sem erro.

---

## Domínio

- [ ] No **Node.js App** criado: **Connect domain** / **Conectar domínio**.
- [ ] Selecionou **vemnoquiz.com.br** como domínio **desse** app (não de outro site PHP/estático).

---

## Conferência

- [ ] **https://vemnoquiz.com.br/health** → responde **ok**.
- [ ] **https://vemnoquiz.com.br** → abre a página inicial.
- [ ] **https://vemnoquiz.com.br/cadastro** → abre o formulário; ao cadastrar, não aparece “Sem conexão com o banco”.

---

**Se algo falhar**

- **503:** domínio não está ligado a este Node.js App, ou o app não subiu. Veja **Logs** do Node.js App.
- **“Sem conexão com o banco” no cadastro:** variáveis de ambiente incompletas/erradas ou schema não importado no phpMyAdmin.
- **Página em branco ou erro 500:** veja **Logs** do Node.js App.
