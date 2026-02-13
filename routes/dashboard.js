'use strict';
const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const [myProjects] = await db.query('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC', [req.session.userId]);
    const [myProposals] = await db.query(
      `SELECT pr.*, p.title as project_title, p.status as project_status
       FROM proposals pr JOIN projects p ON pr.project_id = p.id
       WHERE pr.freelancer_id = ? ORDER BY pr.created_at DESC`,
      [req.session.userId]
    );
    res.render('dashboard', {
      myProjects: myProjects || [],
      myProposals: myProposals || [],
      user: { id: req.session.userId, name: req.session.userName, role: req.session.userRole },
    });
  } catch (e) {
    res.render('dashboard', {
      myProjects: [],
      myProposals: [],
      user: { id: req.session.userId, name: req.session.userName, role: req.session.userRole },
    });
  }
});

module.exports = router;
