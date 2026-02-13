# MaisFreelas — Funcionalidades e Roadmap

## O que já existe (implementado)

### Autenticação
- **Login** com e-mail e senha; sessão com cookie seguro; redirect para a página que o usuário tentou acessar (ex.: `/dashboard` → login → volta ao dashboard).
- **Cadastro** com nome, e-mail, senha (mín. 6 caracteres), papel (Cliente / Freelancer / Ambos).
- **Logout**; proteção de rotas (`requireAuth`, `requireGuest`).
- **Banco** criado automaticamente na subida do app (tabelas `users`, `projects`, `proposals`).

### Projetos
- **Listagem** de projetos abertos com **filtro por categoria** (chips: Todas, e uma por categoria).
- **Detalhe** do projeto (título, descrição, categoria, orçamento, status, cliente).
- **Publicar projeto** (título, descrição, categoria, habilidades, nível, orçamento, prazo).
- **Propostas**: freelancer envia proposta (carta, valor, prazo em dias); cliente aceita ou rejeita.
- **Concluir projeto** (cliente, quando status = Em andamento).
- **Cancelar projeto** (cliente, quando Aberto ou Em andamento).

### Dashboard
- **Meus projetos**: lista dos projetos do usuário (como cliente) com status em português (Aberto, Em andamento, Concluído, Cancelado).
- **Minhas propostas**: lista das propostas enviadas pelo usuário com status (Pendente, Aceita, Rejeitada).
- Links para a página do projeto e atalhos (Publicar projeto, Ver projetos).

### Layout e UX
- Tema claro (fundo branco), cores harmonizadas (âmbar/destaque).
- Header com logo, navegação (Projetos, Entrar/Dashboard), Cadastrar/Sair.
- Cache-busting no CSS (`?v=timestamp`) para atualização após deploy.
- Páginas de login e cadastro recriadas (markup limpo, mensagens de erro amigáveis).

---

## O que falta (para evoluir a plataforma)

### Prioridade alta
| Funcionalidade | Descrição | Sugestão de tecnologia |
|----------------|-----------|-------------------------|
| **Recuperar senha** | "Esqueci minha senha" com link por e-mail | Nodemailer + token em tabela `password_resets` (expira em 1h) |
| **Perfil do usuário** | Editar nome, bio; foto (opcional) | Multer (upload) ou URL; página `/perfil` |
| **Notificações** | Avisar: nova proposta, proposta aceita/rejeitada, projeto concluído | Tabela `notifications` + badge no header; opcional: e-mail (Nodemailer) ou Socket.io |

### Prioridade média
| Funcionalidade | Descrição | Sugestão de tecnologia |
|----------------|-----------|-------------------------|
| **Mensagens/Chat** | Cliente e freelancer conversarem após proposta aceita | Tabela `messages` (project_id, sender_id, body, created_at); página ou modal; opcional: Socket.io para tempo real |
| **Busca e filtros avançados** | Busca por texto; filtro por orçamento, prazo, nível | Query com `LIKE` e `WHERE`; formulário na listagem |
| **Avaliações** | Cliente avalia freelancer (e opcionalmente vice-versa) após conclusão | Tabela `reviews` (project_id, reviewer_id, reviewee_id, rating, comment); estrelas + comentário |
| **Editar projeto** | Cliente editar título/descrição/orçamento enquanto status = Aberto | Rota `GET/POST /projetos/:id/editar`; mesmo form do criar, pré-preenchido |

### Prioridade baixa
| Funcionalidade | Descrição | Sugestão de tecnologia |
|----------------|-----------|-------------------------|
| **Pagamentos** | Integrar pagamento (liberar quando projeto concluído) | API Mercado Pago ou Stripe; tabela `payments`; webhook para confirmação |
| **CSRF** | Proteger formulários contra CSRF | `csurf` (ou `csrf-csrf` no Express) + token em todos os forms |
| **Rate limiting** | Limitar tentativas de login e cadastro por IP | `express-rate-limit` |
| **E-mail de boas-vindas** | Enviar e-mail após cadastro | Nodemailer + template HTML |
| **Dashboard com métricas** | Resumo: total de projetos, propostas, valor | Mesmas rotas; cards no topo do dashboard com totais |
| **API REST (opcional)** | Para app mobile ou integrações | Rotas em `/api/*` com JWT; mesmo banco |

---

## Sobre o /dashboard em produção

Ao acessar **https://vemnoquiz.com.br/dashboard** sem estar logado, o sistema redireciona para **Entrar** com a mensagem *"Faça login para acessar seu painel"*. Após login, o usuário é enviado de volta ao **Dashboard**. Isso é o comportamento esperado.

Se mesmo após login o dashboard não aparecer, verifique:
1. Cookie de sessão (HTTPS, `secure: true`, mesmo domínio).
2. Banco e tabelas criados (rota `/health-db`).
3. `SESSION_SECRET` no `.env` em produção (e servidor reiniciado após alterar).

---

## Stack atual

- **Backend:** Node.js, Express
- **View engine:** EJS
- **Banco:** MySQL (driver mysql2)
- **Sessão:** express-session (cookie)
- **Senha:** bcrypt
- **Estilos:** CSS customizado (variáveis, tema claro), Tailwind (CDN) no header

Para novas funcionalidades, manter Node + Express + MySQL e acrescentar apenas o necessário (ex.: Nodemailer, Multer, Socket.io) conforme a tabela acima.
