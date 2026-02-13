'use strict';
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const db = require('./config/db');
const { ensureDatabase } = require('./database/ensure');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// Sempre 0.0.0.0 se PORT vier do ambiente (produção), senão proxy não alcança = 503
const HOST = process.env.HOST || (process.env.PORT ? '0.0.0.0' : 'localhost');

process.on('uncaughtException', (e) => console.error('uncaughtException', e.message));
process.on('unhandledRejection', (r) => console.error('unhandledRejection', r));

app.get('/health', (req, res) => res.status(200).send('ok'));

app.get('/health-db', async (req, res) => {
  try {
    const result = await db.testConnection();
    if (result && result.ok) return res.json({ ok: true, message: 'Banco conectado.' });
    res.status(503).json({
      ok: false,
      message: (result && result.message) || 'Sem conexão',
      hint: (result && result.code) === 'ECONNREFUSED'
        ? 'MySQL não está rodando ou DB_HOST/DB_PORT no .env estão errados.'
        : (result && result.code) === 'ER_ACCESS_DENIED_ERROR'
        ? 'Usuário ou senha do MySQL no .env estão incorretos.'
        : (result && result.code) === 'ER_BAD_DB_ERROR'
        ? 'O banco não existe. Crie o banco e execute database/schema.sql'
        : 'Verifique .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) e se o MySQL está ativo.',
    });
  } catch (e) {
    console.error('health-db:', e.message);
    res.status(503).json({ ok: false, message: 'Erro ao verificar banco.' });
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'maisfreelas-dev',
  resave: false,
  saveUninitialized: false,
  name: 'maisfreelas.sid',
  cookie: {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
  },
}));

app.use((req, res, next) => {
  res.locals.user = req.session?.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;
  next();
});

app.get('/', async (req, res, next) => {
  let featuredProjects = [];
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.description, p.category, p.budget, p.created_at, u.name as client_name
       FROM projects p JOIN users u ON p.client_id = u.id
       WHERE p.status = 'open' ORDER BY p.created_at DESC LIMIT 6`
    );
    featuredProjects = rows || [];
  } catch (_) {}
  try {
    res.render('home', { featuredProjects });
  } catch (e) {
    next(e);
  }
});

app.use(authRoutes);
app.use('/projetos', projectRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((req, res, next) => {
  res.status(404);
  res.render('404', (err, html) => {
    if (err) return next(err);
    res.send(html);
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (!res.headersSent) res.status(500).send('Erro interno.');
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

ensureDatabase()
  .then(() => {
    console.log('[DB] Banco e tabelas prontos (inicialização automática).');
    startServer();
  })
  .catch((e) => {
    console.error('[DB] Inicialização automática do banco falhou:', e.message);
    console.error('[DB] Verifique .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME e se o MySQL está rodando.');
    startServer();
  });
