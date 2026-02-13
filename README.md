# MaisFreelas

Plataforma de projetos e propostas para freelancers. Pronto para produção na Hostinger (vemnoquiz.com.br).

---

## Produção Hostinger (vemnoquiz.com.br)

Siga o arquivo **FAZER_NA_HOSTINGER.md** passo a passo. Em resumo:

1. Criar banco e usuário MySQL no painel → importar **database/schema.sql** no phpMyAdmin.
2. **Websites** → **Add Website** → **Node.js Apps** → Import Git (developeragencia/maisfreelas).
3. **Start command:** `npm start`. **Variáveis de ambiente:** copiar de **HOSTINGER_VARIAVEIS.txt**.
4. **Connect domain:** vincular **vemnoquiz.com.br** a esse Node.js App.

Dados do banco: **CONFIG_BANCO.md**.

---

## Desenvolvimento local

1. `npm install`
2. Copie `.env.example` para `.env` e preencha com os dados do MySQL local (ou do painel Hostinger para testar).
3. No MySQL, execute `database/schema.sql`.
4. `npm start` → http://localhost:3000

---

**Sobre as 2 vulnerabilidades do npm:** São em dependências indiretas (tar/node-pre-gyp). Não impedem o deploy. Em produção o app usa apenas as rotas e o banco configurado.
