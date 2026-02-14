# MaisFreelas — Funcionalidades e Roadmap

## O que já existe (implementado)

### Autenticação
- **Login** com e-mail e senha; sessão com cookie seguro; redirect para a página que o usuário tentou acessar.
- **Cadastro** com nome, e-mail, senha (mín. 6 caracteres), papel (Cliente / Freelancer / Ambos).
- **Esqueci minha senha** (página e fluxo; envio por e-mail em breve).
- **Perfil** (editar nome e bio).
- **Logout**; proteção de rotas (`requireAuth`, `requireGuest`).
- **Banco** criado automaticamente na subida do app (tabelas `users`, `projects`, `proposals`, `notifications`, `messages`, `reviews`).

### Projetos
- **Listagem** com **busca** (título/descrição), **filtros** por categoria, nível, orçamento mín/máx.
- **Detalhe** do projeto; **editar projeto** (cliente, quando status = Aberto).
- **Publicar projeto**; **Propostas** (enviar, aceitar, rejeitar); **Concluir** e **Cancelar** projeto.
- **Mensagens (chat)** entre cliente e freelancer no projeto (após proposta aceita).
- **Avaliações (reviews)**: cliente avalia o freelancer (1–5 estrelas + comentário) após conclusão.

### Freelancers
- **Listagem** em `/freelancers` com filtro por categoria (freelancers que já atuaram na categoria).
- **Perfil público** do freelancer: bio, projetos concluídos, total recebido, avaliações e média.

### Notificações
- **Notificações** (nova proposta, proposta aceita/rejeitada, projeto concluído); badge no header; página `/notificacoes` (marcar lida / marcar todas).

### Dashboard
- **Métricas**: projetos publicados, concluídos, propostas enviadas, aceitas, valor recebido (propostas aceitas).
- **Meus projetos** e **Minhas propostas** com status em português.

### Layout e UX
- Tema claro (fundo branco), cores harmonizadas (âmbar).
- Header: Projetos, Freelancers, Dashboard, Perfil, Notificações (com badge), Sair/Cadastrar.
- Cache-busting no CSS; página de erro amigável; home com “Como funciona”, projetos em destaque e CTA.

---

## O que falta (para evoluir a plataforma)

### Prioridade alta
| Funcionalidade | Descrição | Sugestão de tecnologia |
|----------------|-----------|-------------------------|
| **Recuperar senha (e-mail)** | Enviar link de redefinição por e-mail | Nodemailer + tabela `password_resets` (token, expira 1h) |

### Prioridade média
| Funcionalidade | Descrição | Sugestão de tecnologia |
|----------------|-----------|-------------------------|
| **Pagamento na plataforma** | Liberar pagamento quando projeto concluído | Mercado Pago ou Stripe; tabela `payments`; webhook |

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
