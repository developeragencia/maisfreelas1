'use strict';
const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const uid = req.session.userId;
  const user = { id: uid, name: req.session.userName, role: req.session.userRole };
  try {
    const [myProjects] = await db.query('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC', [uid]);
    const [myProposals] = await db.query(
      `SELECT pr.*, p.title as project_title, p.status as project_status
       FROM proposals pr JOIN projects p ON pr.project_id = p.id
       WHERE pr.freelancer_id = ? ORDER BY pr.created_at DESC`,
      [uid]
    );
    let stats = { projectsTotal: 0, projectsCompleted: 0, proposalsTotal: 0, proposalsAccepted: 0, valueReceived: 0, valuePublished: 0 };
    try {
      const [[r1]] = await db.query('SELECT COUNT(*) as c, COALESCE(SUM(budget), 0) as total FROM projects WHERE client_id = ?', [uid]);
      stats.projectsTotal = (r1 && r1.c) || 0;
      stats.valuePublished = Number((r1 && r1.total) || 0);
      const [[r2]] = await db.query('SELECT COUNT(*) as c FROM projects WHERE client_id = ? AND status = ?', [uid, 'completed']);
      stats.projectsCompleted = (r2 && r2.c) || 0;
      const [[r3]] = await db.query('SELECT COUNT(*) as c FROM proposals WHERE freelancer_id = ?', [uid]);
      stats.proposalsTotal = (r3 && r3.c) || 0;
      const [[r4]] = await db.query('SELECT COUNT(*) as c, COALESCE(SUM(amount), 0) as total FROM proposals WHERE freelancer_id = ? AND status = ?', [uid, 'accepted']);
      stats.proposalsAccepted = (r4 && r4.c) || 0;
      stats.valueReceived = Number((r4 && r4.total) || 0);
    } catch (_) {}
    res.render('dashboard', {
      myProjects: myProjects || [],
      myProposals: myProposals || [],
      stats,
      user,
    });
  } catch (e) {
    res.render('dashboard', {
      myProjects: [],
      myProposals: [],
      stats: { projectsTotal: 0, projectsCompleted: 0, proposalsTotal: 0, proposalsAccepted: 0, valueReceived: 0, valuePublished: 0 },
      user,
    });
  }
});

module.exports = router;
