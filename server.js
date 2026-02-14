'use strict';
const path = require('path');
// Carrega .env: primeiro da pasta do app, depois da pasta atual (produção pode rodar de outro cwd)
require('dotenv').config({ path: path.join(__dirname, '.env') });
if (!process.env.DB_USER && !process.env.DB_NAME) {
  require('dotenv').config();
}
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const db = require('./config/db');
const { ensureDatabase } = require('./database/ensure');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const freelancerRoutes = require('./routes/freelancers');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// Sempre 0.0.0.0 se PORT vier do ambiente (produção), senão proxy não alcança = 503
const HOST = process.env.HOST || (process.env.PORT ? '0.0.0.0' : 'localhost');

process.on('uncaughtException', (e) => console.error('uncaughtException', e.message));
process.on('unhandledRejection', (r) => {
  console.error('unhandledRejection', r && (r.message || r));
});

app.get('/health', (req, res) => res.status(200).send('ok'));

app.get('/health-db', async (req, res) => {
  try {
    const result = await db.testConnection();
    if (result && result.ok) return res.json({ ok: true, message: 'Banco conectado.' });
    const msg = (result && result.message) || 'Sem conexão';
    const isAccessDenied = (result && result.code) === 'ER_ACCESS_DENIED_ERROR';
    const isEmptyUser = typeof msg === 'string' && (msg.includes("user ''") || msg.includes('using password: NO'));
    let hint = 'Verifique .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) e se o MySQL está ativo.';
    if ((result && result.code) === 'ECONNREFUSED') hint = 'MySQL não está rodando ou DB_HOST/DB_PORT estão errados.';
    else if ((result && result.code) === 'ER_BAD_DB_ERROR') hint = 'O banco não existe. O app cria automaticamente ao subir; confira DB_NAME no .env.';
    else if (isAccessDenied && isEmptyUser) hint = 'DB_USER e DB_PASSWORD estão vazios. No painel do servidor (ex.: Hostinger), defina as variáveis de ambiente DB_HOST, DB_USER, DB_PASSWORD e DB_NAME, ou coloque um arquivo .env na raiz do projeto com essas variáveis.';
    else if (isAccessDenied) hint = 'Usuário ou senha do MySQL incorretos. Confira DB_USER e DB_PASSWORD no .env ou nas variáveis de ambiente do servidor.';
    res.status(503).json({ ok: false, message: msg, hint });
  } catch (e) {
    console.error('health-db:', e.message);
    res.status(503).json({ ok: false, message: 'Erro ao verificar banco.' });
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
// Quebra de cache: a cada reinício do servidor o navegador busca CSS/JS de novo
app.locals.assetVersion = Date.now();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Atrás do proxy (Hostinger), a requisição chega em HTTP; cookie com secure: true pode não ser setado.
// Deixar secure como false garante que o cookie seja gravado; o site continua em HTTPS na ponta.
app.use(session({
  secret: process.env.SESSION_SECRET || 'maisfreelas-dev',
  resave: false,
  saveUninitialized: false,
  name: 'maisfreelas.sid',
  cookie: {
    path: '/',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
  },
}));

const notifications = require('./lib/notifications');
const { wrapAsync } = require('./lib/asyncHandler');

app.use((req, res, next) => {
  res.locals.user = req.session?.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;
  next();
});

app.use(wrapAsync(async (req, res, next) => {
  res.locals.notificationsUnread = 0;
  if (req.session && req.session.userId) {
    try {
      res.locals.notificationsUnread = await notifications.getUnreadCount(req.session.userId);
    } catch (_) {}
  }
  next();
}));

app.get('/', wrapAsync(async (req, res, next) => {
  let featuredProjects = [];
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.description, p.category, p.budget, p.created_at, u.name as client_name
       FROM projects p JOIN users u ON p.client_id = u.id
       WHERE p.status = 'open' ORDER BY p.created_at DESC LIMIT 6`
    );
    featuredProjects = rows || [];
  } catch (_) {}
  res.render('home', { featuredProjects });
}));

app.use(authRoutes);
app.use('/projetos', projectRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/notificacoes', notificationRoutes);
app.use('/freelancers', freelancerRoutes);

app.use((req, res, next) => {
  res.status(404);
  res.render('404', (err, html) => {
    if (err) return next(err);
    res.send(html);
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500);
  res.render('error', { message: 'Erro interno. Tente novamente em alguns instantes.' }, (renderErr, html) => {
    if (renderErr) {
      console.error('Error view:', renderErr.message);
      res.send('Erro interno. Tente novamente.');
    } else {
      res.send(html);
    }
  });
});

function startServer() {
  const server = app.listen(PORT, HOST, () => {
    console.log('MaisFreelas http://%s:%s', HOST, PORT);
  });
  server.on('error', (e) => {
    console.error('listen:', e.message);
    process.exit(1);
  });
  db.testConnection().then(result => {
    const ok = result && result.ok;
    console.log(ok ? '[DB] MySQL OK' : '[DB] MySQL inacessível – confira .env');
    if (!ok && result && result.message) console.log('[DB]', result.message);
  }).catch(() => {});
}

// Servidor sobe NA HORA; banco inicializa em background (evita 503 – site fica no ar mesmo se MySQL demorar)
startServer();
ensureDatabase()
  .then(() => {
    console.log('[DB] Banco e tabelas prontos.');
    return db.query('SELECT 1 FROM users LIMIT 1').then(() => console.log('[DB] Tabela users OK')).catch(() => {});
  })
  .catch((e) => {
    console.error('[DB] Init falhou:', e.message);
  });
