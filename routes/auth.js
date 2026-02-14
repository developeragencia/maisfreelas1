'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { requireGuest, requireAuth } = require('../middleware/auth');
const { wrapAsync } = require('../lib/asyncHandler');

const router = express.Router();
const ROLES = ['client', 'freelancer', 'both'];

function safeRedirect(path) {
  if (path != null && Array.isArray(path)) path = path[0];
  if (!path || typeof path !== 'string') return '/dashboard';
  const p = String(path).trim();
  if (p.startsWith('/') && !p.startsWith('//')) return p;
  return '/dashboard';
}

function getRedirect(req) {
  const raw = req.query.redirect || (req.body && req.body.redirect);
  return raw ? safeRedirect(raw) : null;
}

router.get('/login', requireGuest, (req, res) => {
  try {
    const redirect = getRedirect(req);
    res.render('login', { error: null, redirect: redirect || null });
  } catch (e) {
    console.error('GET /login:', e.message);
    res.status(500).render('error', { message: 'Não foi possível carregar a página de login. Tente novamente.' });
  }
});

router.post('/login', requireGuest, wrapAsync(async (req, res) => {
  const email = (req.body && req.body.email) ? String(req.body.email).trim() : '';
  const password = req.body && req.body.password ? String(req.body.password) : '';
  const redirect = getRedirect(req);
  if (!email || !password) return res.render('login', { error: 'Preencha e-mail e senha.', redirect });
  try {
    const [rows] = await db.query('SELECT id, name, email, password, role FROM users WHERE email = ?', [email]);
    if (!rows || !rows.length) return res.render('login', { error: 'E-mail ou senha incorretos.', redirect });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.render('login', { error: 'E-mail ou senha incorretos.', redirect });
    req.session.regenerate((errReg) => {
      if (errReg) {
        console.error('Session regenerate:', errReg.message);
        return res.render('login', { error: 'Serviço temporariamente indisponível. Tente em alguns minutos.', redirect: null });
      }
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userRole = user.role;
      req.session.save((err) => {
        if (err) {
          console.error('Session save:', err.message);
          return res.render('login', { error: 'Serviço temporariamente indisponível. Tente em alguns minutos.', redirect: null });
        }
        const goTo = redirect || '/dashboard';
        res.redirect(302, goTo);
      });
    });
  } catch (e) {
    console.error('Login:', e.message);
    const msg = (e.code === 'ECONNREFUSED' || e.code === 'ER_ACCESS_DENIED_ERROR' || e.code === 'ER_BAD_DB_ERROR' || e.code === 'ER_NO_SUCH_TABLE')
      ? 'Serviço temporariamente indisponível. Tente em alguns minutos.'
      : 'Erro ao entrar. Tente de novo.';
    res.render('login', { error: msg, redirect: null });
  }
}));

router.get('/cadastro', requireGuest, (req, res) => {
  res.render('register', { error: null, name: '', email: '', role: 'both' });
});

router.post('/cadastro', requireGuest, wrapAsync(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  const nome = String(name || '').trim();
  const emailTrim = String(email || '').trim();
  const senha = String(password || '');
  const roleVal = ROLES.includes(String(role || '').trim()) ? String(role).trim() : 'both';

  if (!nome) return res.render('register', { error: 'Preencha o nome.', name: nome, email: emailTrim, role: roleVal });
  if (!emailTrim) return res.render('register', { error: 'Preencha o e-mail.', name: nome, email: emailTrim, role: roleVal });
  if (!senha) return res.render('register', { error: 'Preencha a senha.', name: nome, email: emailTrim, role: roleVal });
  if (senha.length < 6) return res.render('register', { error: 'Senha com no mínimo 6 caracteres.', name: nome, email: emailTrim, role: roleVal });

  try {
    const hash = await bcrypt.hash(senha, 10);
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [nome, emailTrim, hash, roleVal]);
    return res.redirect(302, '/login');
  } catch (e) {
    console.error('Cadastro:', e.code || e.message, e.sqlMessage || '');
    if (e.code === 'ER_DUP_ENTRY') return res.render('register', { error: 'Este e-mail já está cadastrado.', name: nome, email: emailTrim, role: roleVal });
    const dbUnavailable = ['ER_NO_SUCH_TABLE', 'ER_BAD_DB_ERROR', 'ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ETIMEDOUT', 'ENOTFOUND'].includes(e.code);
    if (dbUnavailable) {
      console.error('[DB] Cadastro falhou – banco inacessível. Confira variáveis de ambiente (DB_HOST=localhost, DB_USER, DB_PASSWORD, DB_NAME).');
      return res.render('register', { error: 'Banco de dados indisponível. Verifique a configuração do servidor (variáveis DB_HOST, DB_USER, DB_PASSWORD) e tente em alguns minutos.', name: nome, email: emailTrim, role: roleVal });
    }
    return res.render('register', { error: 'Não foi possível concluir o cadastro. Tente novamente em alguns minutos.', name: nome, email: emailTrim, role: roleVal });
  }
}));

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/esqueci-senha', requireGuest, (req, res) => {
  res.render('forgot-password', { error: null, success: false });
});

router.post('/esqueci-senha', requireGuest, wrapAsync(async (req, res) => {
  const email = (req.body && req.body.email) ? String(req.body.email).trim() : '';
  if (!email) return res.render('forgot-password', { error: 'Informe seu e-mail.', success: false });
  try {
    await db.query('SELECT id FROM users WHERE email = ?', [email]);
  } catch (e) {
    console.error('Esqueci senha:', e.message);
  }
  res.render('forgot-password', { error: null, success: true });
}));

router.get('/perfil', requireAuth, wrapAsync(async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, bio FROM users WHERE id = ?', [req.session.userId]);
    if (!rows || !rows.length) return res.redirect('/logout');
    return res.render('profile', { user: rows[0], error: null });
  } catch (e) {
    console.error('Perfil:', e.message);
    res.status(500).render('error', { message: 'Não foi possível carregar o perfil. Tente novamente.' });
  }
}));

router.post('/perfil', requireAuth, async (req, res) => {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  const bio = (req.body && req.body.bio) != null ? String(req.body.bio).trim() : '';
  if (!name) {
    try {
      const [rows] = await db.query('SELECT id, name, email, role, bio FROM users WHERE id = ?', [req.session.userId]);
      return res.render('profile', { user: rows && rows[0] ? rows[0] : { name: req.session.userName, email: '', role: '', bio: '' }, error: 'Preencha o nome.' });
    } catch (_) {
      return res.render('profile', { user: { name: req.session.userName, email: '', role: '', bio: '' }, error: 'Preencha o nome.' });
    }
  }
  try {
    await db.query('UPDATE users SET name = ?, bio = ? WHERE id = ?', [name, bio || null, req.session.userId]);
    req.session.userName = name;
    req.session.save((err) => {
      if (err) console.error('Session save:', err.message);
      res.redirect('/perfil');
    });
  } catch (e) {
    console.error('Perfil update:', e.message);
    try {
      const [rows] = await db.query('SELECT id, name, email, role, bio FROM users WHERE id = ?', [req.session.userId]);
      return res.render('profile', { user: rows && rows[0] ? rows[0] : { name: req.session.userName, email: '', role: '', bio: '' }, error: 'Erro ao salvar. Tente novamente.' });
    } catch (_) {
      res.render('profile', { user: { name: req.session.userName, email: '', role: '', bio: '' }, error: 'Erro ao salvar. Tente novamente.' });
    }
  }
});

module.exports = router;
