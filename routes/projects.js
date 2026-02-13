'use strict';
const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name as client_name FROM projects p
       JOIN users u ON p.client_id = u.id
       WHERE p.status = 'open' ORDER BY p.created_at DESC`
    );
    res.render('projects/index', { projects: rows || [], user: res.locals.user });
  } catch (e) {
    res.render('projects/index', { projects: [], user: null });
  }
});

router.get('/publicar', requireAuth, (req, res) => {
  res.render('projects/create', { error: null });
});

router.post('/publicar', requireAuth, async (req, res) => {
  const { title, description, category, skills, level, budget, deadline } = req.body || {};
  if (!title || !description || !category || !budget) return res.render('projects/create', { error: 'Preencha título, descrição, categoria e orçamento.' });
  try {
    await db.query(
      `INSERT INTO projects (title, description, category, skills, level, budget, deadline, client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description.trim(), (category || '').trim(), (skills || '').trim(), level || 'intermediate', parseFloat(budget) || 0, deadline || null, req.session.userId]
    );
    res.redirect('/projetos');
  } catch (e) {
    res.render('projects/create', { error: 'Erro ao publicar. Tente de novo.' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.redirect('/projetos');
  try {
    const [projects] = await db.query(
      `SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id WHERE p.id = ?`, [id]
    );
    if (!projects?.length) return res.redirect('/projetos');
    const [proposals] = await db.query(
      `SELECT pr.*, u.name as freelancer_name FROM proposals pr JOIN users u ON pr.freelancer_id = u.id WHERE pr.project_id = ? ORDER BY pr.created_at DESC`, [id]
    );
    const canPropose = req.session?.userId && projects[0].client_id !== req.session.userId && projects[0].status === 'open';
    res.render('projects/show', { project: projects[0], proposals: proposals || [], canPropose, user: res.locals.user });
  } catch (e) {
    res.redirect('/projetos');
  }
});

router.post('/:id/proposta', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { cover_letter, amount, delivery_time } = req.body || {};
  if (!id || !cover_letter || !amount || !delivery_time) return res.redirect('/projetos/' + id);
  try {
    const [projects] = await db.query('SELECT id, client_id, status FROM projects WHERE id = ?', [id]);
    if (!projects?.length || projects[0].client_id === req.session.userId || projects[0].status !== 'open') return res.redirect('/projetos');
    await db.query(
      'INSERT INTO proposals (cover_letter, amount, delivery_time, project_id, freelancer_id) VALUES (?, ?, ?, ?, ?)',
      [cover_letter.trim(), parseFloat(amount) || 0, parseInt(delivery_time, 10) || 0, id, req.session.userId]
    );
    res.redirect('/projetos/' + id);
  } catch (e) {
    res.redirect('/projetos/' + id);
  }
});

module.exports = router;
