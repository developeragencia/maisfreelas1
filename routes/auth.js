'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { requireGuest } = require('../middleware/auth');

const router = express.Router();
const ROLES = ['client', 'freelancer', 'both'];

router.get('/login', requireGuest, (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', requireGuest, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.render('login', { error: 'Preencha e-mail e senha.' });
  try {
    const [rows] = await db.query('SELECT id, name, email, password, role FROM users WHERE email = ?', [String(email).trim()]);
    if (!rows?.length) return res.render('login', { error: 'E-mail ou senha incorretos.' });
    const user = rows[0];
    const ok = await bcrypt.compare(String(password), user.password || '');
    if (!ok) return res.render('login', { error: 'E-mail ou senha incorretos.' });
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.save((err) => {
      if (err) {
        console.error('Session save:', err.message);
        return res.render('login', { error: 'Erro ao entrar. Tente de novo.' });
      }
      res.redirect('/dashboard');
    });
  } catch (e) {
    console.error('Login:', e.message);
    res.render('login', { error: 'Erro ao entrar. Tente de novo.' });
  }
});

router.get('/cadastro', requireGuest, (req, res) => {
  res.render('register', { error: null });
});

router.post('/cadastro', requireGuest, async (req, res) => {
  const { name, email, password, role } = req.body || {};
  const nome = String(name || '').trim();
  const emailTrim = String(email || '').trim();
  const senha = String(password || '');

  if (!nome) return res.render('register', { error: 'Preencha o nome.' });
  if (!emailTrim) return res.render('register', { error: 'Preencha o e-mail.' });
  if (!senha) return res.render('register', { error: 'Preencha a senha.' });
  if (senha.length < 6) return res.render('register', { error: 'Senha com no mínimo 6 caracteres.' });

  const roleVal = ROLES.includes(String(role || '').trim()) ? String(role).trim() : 'both';

  try {
    const hash = await bcrypt.hash(senha, 10);
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [nome, emailTrim, hash, roleVal]);
    res.redirect('/login');
  } catch (e) {
    console.error('Cadastro:', e.code || e.message);
    if (e.code === 'ER_DUP_ENTRY') return res.render('register', { error: 'Este e-mail já está cadastrado.' });
    if (e.code === 'ER_ACCESS_DENIED_ERROR' || e.code === 'ECONNREFUSED') return res.render('register', { error: 'Sem conexão com o banco. Verifique .env e MySQL.' });
    if (e.code === 'ER_BAD_DB_ERROR') return res.render('register', { error: 'Banco não existe. Crie no painel e execute database/schema.sql.' });
    if (e.code === 'ER_NO_SUCH_TABLE') return res.render('register', { error: 'Execute database/schema.sql no phpMyAdmin.' });
    res.render('register', { error: process.env.NODE_ENV === 'production' ? 'Erro ao cadastrar.' : (e.sqlMessage || e.message) });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
