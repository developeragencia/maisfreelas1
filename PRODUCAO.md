# Rodar MaisFreelas em produção no servidor

Siga estes passos **no servidor** (SSH ou terminal do painel).

---

## 1. Exigências no servidor

- **Node.js** 18 ou superior: `node -v`
- **MySQL** rodando (para cadastro/login funcionar)
- **Nginx** (ou Apache) como proxy reverso

Se não tiver Node: instale (ex. Ubuntu/Debian: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -` e `sudo apt install -y nodejs`).

---

## 2. Enviar o projeto para o servidor

Exemplo com o projeto na pasta `/var/www/maisfreelas`:

- Envie os arquivos (FTP, Git, painel de upload):
  - `server.js`, `package.json`, `ecosystem.config.cjs`
  - pastas: `config/`, `routes/`, `middleware/`, `views/`, `public/`, `database/`
  - arquivo `.env` (crie no servidor, veja passo 3)

---

## 3. Arquivo .env no servidor

Na pasta do projeto (ex.: `/var/www/maisfreelas`), crie o arquivo `.env`:

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=uma_chave_secreta_longa_e_aleatoria_aqui

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=usuario_mysql
DB_PASSWORD=senha_mysql
DB_NAME=nome_do_banco
```

- Troque `usuario_mysql`, `senha_mysql` e `nome_do_banco` pelos dados do MySQL do servidor.
- Crie o banco no MySQL (phpMyAdmin ou `CREATE DATABASE nome_do_banco;`) e importe o conteúdo de `database/schema.sql`.

---

## 4. Instalar dependências e subir o app

No servidor, na pasta do projeto:

```bash
cd /var/www/maisfreelas
npm install --production
```

**Opção A – Com PM2 (recomendado):**

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

**Opção B – Sem PM2 (script do package.json):**

```bash
npm run prod
```

(Para manter rodando em segundo plano sem PM2, use `nohup npm run prod &` ou um serviço systemd.)

---

## 5. Conferir se está respondendo

No próprio servidor:

```bash
curl http://127.0.0.1:3000/health
```

Deve retornar: `ok`.

Se retornar `ok`, o Node está rodando. Se o site ainda der 503, o problema é o proxy (passo 6).

---

## 6. Configurar Nginx para o domínio

O Nginx precisa encaminhar o tráfego para a porta 3000. Exemplo para `vemnoquiz.com.br`:

Arquivo (ex.: `/etc/nginx/sites-available/maisfreelas` ou dentro do seu site existente):

```nginx
server {
    listen 80;
    server_name vemnoquiz.com.br www.vemnoquiz.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative e recarregue:

```bash
sudo ln -sf /etc/nginx/sites-available/maisfreelas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

A porta `3000` deve ser a mesma do `PORT` do `.env`.

---

## 7. Comandos úteis

| Ação | Comando |
|------|--------|
| Ver se está rodando | `pm2 list` |
| Ver logs | `pm2 logs maisfreelas` |
| Reiniciar | `pm2 restart maisfreelas` |
| Parar | `pm2 stop maisfreelas` |
| Testar saúde | `curl http://127.0.0.1:3000/health` |
| Testar banco | Abrir no navegador: `https://vemnoquiz.com.br/health-db` |

---

## Resumo rápido

1. Projeto na pasta do servidor.
2. `.env` com `PORT=3000`, `NODE_ENV=production` e dados do MySQL.
3. Banco criado e `database/schema.sql` importado.
4. `npm install --production` e `pm2 start ecosystem.config.cjs --env production`.
5. Nginx com `proxy_pass http://127.0.0.1:3000;` e `sudo systemctl reload nginx`.

Depois disso, o site deve abrir em produção.
