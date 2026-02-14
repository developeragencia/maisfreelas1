'use strict';
const express = require('express');
const notifications = require('../lib/notifications');
const { requireAuth } = require('../middleware/auth');
const { wrapAsync } = require('../lib/asyncHandler');

const router = express.Router();

router.get('/', requireAuth, wrapAsync(async (req, res) => {
  try {
    const list = await notifications.getForUser(req.session.userId);
    res.render('notifications/index', { notifications: list });
  } catch (e) {
    res.redirect('/dashboard');
  }
}));

router.post('/:id/ler', requireAuth, wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id) try { await notifications.markRead(id, req.session.userId); } catch (_) {}
  const back = req.query.redirect && req.query.redirect.startsWith('/') ? req.query.redirect : '/notificacoes';
  res.redirect(302, back);
}));

router.post('/ler-todas', requireAuth, wrapAsync(async (req, res) => {
  try { await notifications.markAllRead(req.session.userId); } catch (_) {}
  res.redirect(302, req.query.redirect && req.query.redirect.startsWith('/') ? req.query.redirect : '/notificacoes');
}));

module.exports = router;
