# MaisFreelas

Plataforma para conectar projetos e freelancers: cadastro, login, publicar projetos, enviar propostas, aceitar/rejeitar propostas.

---

## Criar o banco de dados do zero

1. **Configure o `.env`** na raiz do projeto (copie de `.env.example`):

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=uma_chave_secreta

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=maisfreelas
```

2. **Crie o banco e as tabelas** com um comando:

```bash
npm run db:init
```

Isso cria o banco (se não existir) e as tabelas `users`, `projects` e `proposals`. O usuário MySQL precisa ter permissão para criar banco.

Se preferir fazer manualmente no MySQL/phpMyAdmin:
- Crie um banco com nome igual a `DB_NAME`;
- Execute o conteúdo do arquivo `database/schema.sql` nesse banco.

---

## Rodar o projeto

```bash
npm install
npm start
```

Acesse: http://localhost:3000

---

## Páginas e funcionalidades

| Rota | Página | O que faz |
|------|--------|-----------|
| `/` | Home | Banner, como funciona, projetos em destaque, CTA |
| `/login` | Login | Entrar com e-mail e senha → redireciona para Dashboard |
| `/cadastro` | Cadastro | Criar conta (nome, e-mail, senha, tipo) → redireciona para Login |
| `/logout` | (POST) | Encerra sessão → redireciona para Home |
| `/projetos` | Lista de projetos | Projetos abertos; botão "Publicar" se logado |
| `/projetos/publicar` | Publicar projeto | Formulário (título, descrição, categoria, orçamento, etc.) |
| `/projetos/:id` | Detalhe do projeto | Ver projeto; enviar proposta (se freelancer); **aceitar/rejeitar** propostas (se dono do projeto) |
| `/dashboard` | Dashboard | Meus projetos e minhas propostas (só logado) |
| `/health` | Saúde | Retorna `ok` (para proxy/servidor) |
| `/health-db` | Saúde do banco | Retorna JSON com status da conexão MySQL |

---

## Fluxo de login e cadastro

1. **Cadastro:** usuário preenche nome, e-mail, senha e tipo (cliente/freelancer/ambos). Senha é salva com bcrypt. Redireciona para `/login`.
2. **Login:** usuário informa e-mail e senha. Session é gravada (`userId`, `userName`, `userRole`) e redireciona para `/dashboard`.
3. **Middleware:** rotas que precisam de usuário logado usam `requireAuth`; `/login` e `/cadastro` usam `requireGuest` (se já logado, redireciona para `/dashboard`).

---

## Aceitar e rejeitar propostas

- Na página do **projeto** (`/projetos/:id`), o **dono do projeto** (cliente) vê as propostas.
- Se o projeto estiver **aberto**, em cada proposta **pendente** aparecem os botões **Aceitar** e **Rejeitar**.
- **Aceitar:** o projeto passa para "Em andamento", o freelancer da proposta fica vinculado ao projeto e as demais propostas são marcadas como rejeitadas.
- **Rejeitar:** apenas aquela proposta fica com status "Rejeitada".

---

## Estrutura do banco (schema)

- **users:** id, name, email, password, role (client/freelancer/both), bio, created_at, updated_at
- **projects:** id, title, description, category, skills, level, budget, deadline, status (open/in_progress/completed/cancelled), client_id, freelancer_id, created_at, updated_at
- **proposals:** id, cover_letter, amount, delivery_time, status (pending/accepted/rejected), project_id, freelancer_id, created_at, updated_at

Para recriar tudo do zero: `npm run db:init` (apaga e recria as tabelas conforme `database/schema.sql`).
