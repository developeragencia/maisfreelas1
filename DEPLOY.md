# Evitar erro 503 (Service Unavailable)

Se a página de login (ou o site) retorna **503**, o proxy (Nginx, etc.) não está conseguindo falar com o Node. Confira:

## 1. App escutando em todas as interfaces
O servidor já está configurado para usar `0.0.0.0` quando `PORT` ou `NODE_ENV=production` estão definidos. No servidor, garanta:
- `PORT=3000` (ou a porta que o proxy usa)
- Ou `NODE_ENV=production`

## 2. Processo Node rodando
- **PM2:** `pm2 start server.js --name maisfreelas` e `pm2 save`
- **systemd:** serviço ativo e habilitado
- Teste local: `curl http://0.0.0.0:PORT/health` deve retornar `ok`

## 3. Proxy (Nginx/Apache) apontando para a porta certa
Exemplo Nginx:
```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```
A porta (`3000`) deve ser a mesma do `PORT` do Node.

## 4. Banco de dados (erro "Sem conexão com o banco")

Se cadastro/login mostra **"Sem conexão com o banco"**:

1. **Teste a conexão:** Acesse `https://seusite.com/health-db`. A resposta indica o problema:
   - `ECONNREFUSED` → MySQL não está rodando ou `DB_HOST`/`DB_PORT` no `.env` estão errados.
   - `ER_ACCESS_DENIED_ERROR` → `DB_USER` ou `DB_PASSWORD` no `.env` estão incorretos.
   - `ER_BAD_DB_ERROR` → O banco não existe; crie o banco e execute `database/schema.sql`.

2. **No servidor,** crie o arquivo `.env` (copie de `.env.example`) e preencha:
   - `DB_HOST` (geralmente `127.0.0.1` se o MySQL está na mesma máquina)
   - `DB_PORT` (geralmente `3306`)
   - `DB_USER` e `DB_PASSWORD` (usuário do MySQL com permissão no banco)
   - `DB_NAME` (nome do banco que você criou)

3. **Crie o banco** no MySQL (phpMyAdmin ou `CREATE DATABASE nome_do_banco;`) e **execute** o conteúdo de `database/schema.sql` nesse banco.

4. Reinicie a aplicação (ex.: `pm2 restart maisfreelas`).

Se o MySQL não estiver acessível, o app continua subindo; só login/cadastro/dashboard falham. 503 na página costuma ser app não rodando ou proxy errado, não DB.

## 5. HTTPS e cookie de sessão
Em produção com HTTPS, use no `.env`:
- `NODE_ENV=production` (o cookie de sessão fica `secure`)

Depois de alterar, reinicie o app (ex.: `pm2 restart maisfreelas`) e o Nginx (`sudo systemctl reload nginx`).
