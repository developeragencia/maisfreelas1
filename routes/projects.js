'use strict';
const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const notifications = require('../lib/notifications');
const { wrapAsync } = require('../lib/asyncHandler');

const router = express.Router();

const emptyProjects = { projects: [], categories: [], currentCategory: null, searchQ: null, searchBudgetMin: null, searchBudgetMax: null, searchLevel: null, user: null };

router.get('/', wrapAsync(async (req, res) => {
  try {
    const category = typeof req.query.categoria === 'string' ? req.query.categoria.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const budgetMin = parseFloat(req.query.orcamento_min);
    const budgetMax = parseFloat(req.query.orcamento_max);
    const level = ['beginner', 'intermediate', 'expert'].includes(req.query.nivel) ? req.query.nivel : '';
    let sql = `SELECT p.*, u.name as client_name FROM projects p
       JOIN users u ON p.client_id = u.id
       WHERE p.status = 'open'`;
    const params = [];
    if (category) { sql += ' AND p.category = ?'; params.push(category); }
    if (q) { sql += ' AND (p.title LIKE ? OR p.description LIKE ?)'; const like = '%' + q.replace(/%/g, '\\%') + '%'; params.push(like, like); }
    if (!isNaN(budgetMin) && budgetMin >= 0) { sql += ' AND p.budget >= ?'; params.push(budgetMin); }
    if (!isNaN(budgetMax) && budgetMax > 0) { sql += ' AND p.budget <= ?'; params.push(budgetMax); }
    if (level) { sql += ' AND p.level = ?'; params.push(level); }
    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await db.query(sql, params);
    const [cats] = await db.query('SELECT DISTINCT category FROM projects WHERE status = ? ORDER BY category', ['open']);
    res.render('projects/index', {
      projects: rows || [],
      categories: (cats || []).map(c => c.category),
      currentCategory: category || null,
      searchQ: q || null,
      searchBudgetMin: !isNaN(budgetMin) ? budgetMin : null,
      searchBudgetMax: !isNaN(budgetMax) ? budgetMax : null,
      searchLevel: level || null,
      user: res.locals.user || null,
    });
  } catch (e) {
    console.error('Projects list:', e.message);
    try {
      res.render('projects/index', { ...emptyProjects, user: res.locals.user || null });
    } catch (_) {
      res.redirect('/');
    }
  }
}));

router.get('/publicar', requireAuth, (req, res) => {
  res.render('projects/create', { error: null });
});

router.get('/:id/editar', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.redirect('/projetos');
  try {
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ? AND client_id = ? AND status = ?', [id, req.session.userId, 'open']);
    if (!projects?.length) return res.redirect('/projetos/' + id);
    res.render('projects/edit', { project: projects[0], error: null });
  } catch (e) {
    res.redirect('/projetos/' + id);
  }
});

router.post('/:id/editar', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description, category, skills, level, budget, deadline } = req.body || {};
  if (!id) return res.redirect('/projetos');
  try {
    const [projects] = await db.query('SELECT id FROM projects WHERE id = ? AND client_id = ? AND status = ?', [id, req.session.userId, 'open']);
    if (!projects?.length) return res.redirect('/projetos/' + id);
    if (!title || !description || !category || !budget) {
      const project = { id, title: title || '', description: description || '', category: category || '', skills: skills || '', level: level || 'intermediate', budget: budget || '', deadline: deadline || null };
      return res.render('projects/edit', { project, error: 'Preencha título, descrição, categoria e orçamento.' });
    }
    await db.query(
      'UPDATE projects SET title = ?, description = ?, category = ?, skills = ?, level = ?, budget = ?, deadline = ? WHERE id = ?',
      [title.trim(), description.trim(), (category || '').trim(), (skills || '').trim(), level || 'intermediate', parseFloat(budget) || 0, deadline || null, id]
    );
    res.redirect('/projetos/' + id);
  } catch (e) {
    res.redirect('/projetos/' + id);
  }
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

router.post('/:id/proposta/:proposalId/aceitar', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const proposalId = parseInt(req.params.proposalId, 10);
  if (!projectId || !proposalId) return res.redirect('/projetos');
  try {
    const [projects] = await db.query('SELECT id, title, client_id, status FROM projects WHERE id = ?', [projectId]);
    if (!projects?.length || projects[0].client_id !== req.session.userId || projects[0].status !== 'open') return res.redirect('/projetos');
    const [proposals] = await db.query('SELECT id, freelancer_id FROM proposals WHERE id = ? AND project_id = ?', [proposalId, projectId]);
    if (!proposals?.length) return res.redirect('/projetos/' + projectId);
    await db.query('UPDATE projects SET status = ?, freelancer_id = ? WHERE id = ?', ['in_progress', proposals[0].freelancer_id, projectId]);
    await db.query('UPDATE proposals SET status = ? WHERE id = ?', ['accepted', proposalId]);
    await db.query('UPDATE proposals SET status = ? WHERE project_id = ? AND id != ?', ['rejected', projectId, proposalId]);
    await notifications.create(proposals[0].freelancer_id, 'proposal_accepted', 'Sua proposta foi aceita!', 'O projeto "' + (projects[0].title || '').slice(0, 80) + '" está em andamento.', '/projetos/' + projectId);
    res.redirect('/projetos/' + projectId);
  } catch (e) {
    res.redirect('/projetos/' + projectId);
  }
});

router.post('/:id/proposta/:proposalId/rejeitar', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const proposalId = parseInt(req.params.proposalId, 10);
  if (!projectId || !proposalId) return res.redirect('/projetos');
  try {
    const [projects] = await db.query('SELECT id, title, client_id, freelancer_id FROM projects WHERE id = ?', [projectId]);
    if (!projects?.length || projects[0].client_id !== req.session.userId) return res.redirect('/projetos');
    const [proposals] = await db.query('SELECT id, freelancer_id FROM proposals WHERE id = ? AND project_id = ?', [proposalId, projectId]);
    await db.query('UPDATE proposals SET status = ? WHERE id = ? AND project_id = ?', ['rejected', proposalId, projectId]);
    if (proposals && proposals[0] && proposals[0].freelancer_id) {
      await notifications.create(proposals[0].freelancer_id, 'proposal_rejected', 'Proposta não aceita', 'O projeto "' + (projects[0].title || '').slice(0, 80) + '" seguiu com outro freelancer.', '/projetos/' + projectId);
    }
    res.redirect('/projetos/' + projectId);
  } catch (e) {
    res.redirect('/projetos/' + projectId);
  }
});

router.post('/:id/concluir', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  if (!projectId) return res.redirect('/projetos');
  try {
    const [projects] = await db.query('SELECT id, title, client_id, freelancer_id, status FROM projects WHERE id = ?', [projectId]);
    if (!projects?.length || projects[0].client_id !== req.session.userId || projects[0].status !== 'in_progress') return res.redirect('/projetos/' + projectId);
    await db.query('UPDATE projects SET status = ? WHERE id = ?', ['completed', projectId]);
    if (projects[0].freelancer_id) {
      await notifications.create(projects[0].freelancer_id, 'project_completed', 'Projeto concluído', 'O projeto "' + (projects[0].title || '').slice(0, 80) + '" foi marcado como concluído.', '/projetos/' + projectId);
    }
    res.redirect('/projetos/' + projectId);
  } catch (e) {
    res.redirect('/projetos/' + projectId);
  }
});

router.post('/:id/cancelar', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  if (!projectId) return res.redirect('/projetos');
  try {
    const [projects] = await db.query('SELECT id, client_id, status FROM projects WHERE id = ?', [projectId]);
    if (!projects?.length || projects[0].client_id !== req.session.userId) return res.redirect('/projetos/' + projectId);
    if (projects[0].status !== 'open' && projects[0].status !== 'in_progress') return res.redirect('/projetos/' + projectId);
    await db.query('UPDATE projects SET status = ? WHERE id = ?', ['cancelled', projectId]);
    res.redirect('/projetos/' + projectId);
  } catch (e) {
    res.redirect('/projetos/' + projectId);
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
    const isOwner = req.session?.userId && projects[0].client_id === req.session.userId;
    const isFreelancer = req.session?.userId && projects[0].freelancer_id === req.session.userId;
    const canChat = isOwner || isFreelancer;
    let messages = [];
    if (canChat) {
      const [msgs] = await db.query(
        `SELECT m.id, m.body, m.created_at, u.name as sender_name, m.sender_id
         FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.project_id = ? ORDER BY m.created_at ASC`,
        [id]
      );
      messages = msgs || [];
    }
    res.render('projects/show', { project: projects[0], proposals: proposals || [], canPropose, isOwner, canChat, messages, user: res.locals.user });
  } catch (e) {
    res.redirect('/projetos');
  }
});

router.post('/:id/mensagem', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = (req.body && req.body.body) ? String(req.body.body).trim() : '';
  if (!id || !body) return res.redirect('/projetos/' + id);
  try {
    const [projects] = await db.query('SELECT id, client_id, freelancer_id FROM projects WHERE id = ?', [id]);
    if (!projects?.length) return res.redirect('/projetos');
    const { client_id, freelancer_id } = projects[0];
    const allowed = req.session.userId === client_id || req.session.userId === freelancer_id;
    if (!allowed) return res.redirect('/projetos/' + id);
    await db.query('INSERT INTO messages (project_id, sender_id, body) VALUES (?, ?, ?)', [id, req.session.userId, body.slice(0, 5000)]);
    res.redirect('/projetos/' + id + '#mensagens');
  } catch (e) {
    res.redirect('/projetos/' + id);
  }
});

router.post('/:id/avaliar', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rating = parseInt(req.body?.rating, 10);
  const comment = (req.body && req.body.comment) ? String(req.body.comment).trim() : '';
  if (!id || !rating || rating < 1 || rating > 5) return res.redirect('/projetos/' + id);
  try {
    const [projects] = await db.query('SELECT id, client_id, freelancer_id, status FROM projects WHERE id = ?', [id]);
    if (!projects?.length || projects[0].status !== 'completed' || projects[0].client_id !== req.session.userId) return res.redirect('/projetos/' + id);
    const freelancerId = projects[0].freelancer_id;
    if (!freelancerId) return res.redirect('/projetos/' + id);
    await db.query(
      'INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)',
      [id, req.session.userId, freelancerId, rating, comment.slice(0, 2000) || null]
    );
    res.redirect('/projetos/' + id);
  } catch (e) {
    res.redirect('/projetos/' + id);
  }
});

router.post('/:id/proposta', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { cover_letter, amount, delivery_time } = req.body || {};
  if (!id || !cover_letter || !amount || !delivery_time) return res.redirect('/projetos/' + id);
  try {
    const [projects] = await db.query('SELECT id, title, client_id, status FROM projects WHERE id = ?', [id]);
    if (!projects?.length || projects[0].client_id === req.session.userId || projects[0].status !== 'open') return res.redirect('/projetos');
    await db.query(
      'INSERT INTO proposals (cover_letter, amount, delivery_time, project_id, freelancer_id) VALUES (?, ?, ?, ?, ?)',
      [cover_letter.trim(), parseFloat(amount) || 0, parseInt(delivery_time, 10) || 0, id, req.session.userId]
    );
    await notifications.create(projects[0].client_id, 'new_proposal', 'Nova proposta no seu projeto', 'Você recebeu uma nova proposta em "' + (projects[0].title || '').slice(0, 80) + '".', '/projetos/' + id);
    res.redirect('/projetos/' + id);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.redirect('/projetos/' + id + '?erro=ja-enviou');
    res.redirect('/projetos/' + id);
  }
});

module.exports = router;
