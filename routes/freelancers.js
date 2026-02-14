'use strict';
const express = require('express');
const db = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const category = typeof req.query.categoria === 'string' ? req.query.categoria.trim() : '';
    let sql = `SELECT DISTINCT u.id, u.name, u.bio, u.role
       FROM users u
       WHERE u.role IN ('freelancer', 'both')`;
    const params = [];
    if (category) {
      sql = `SELECT DISTINCT u.id, u.name, u.bio, u.role
        FROM users u
        INNER JOIN proposals pr ON pr.freelancer_id = u.id AND pr.status = 'accepted'
        INNER JOIN projects p ON p.id = pr.project_id AND p.category = ?
        WHERE u.role IN ('freelancer', 'both')`;
      params.push(category);
    }
    sql += ' ORDER BY u.name ASC';
    const [freelancers] = await db.query(sql, params);
    const [categories] = await db.query(
      `SELECT DISTINCT p.category FROM projects p INNER JOIN proposals pr ON pr.project_id = p.id AND pr.status = 'accepted' ORDER BY p.category`
    );
    res.render('freelancers/index', {
      freelancers: freelancers || [],
      categories: (categories || []).map(c => c.category),
      currentCategory: category || null,
      user: res.locals.user,
    });
  } catch (e) {
    res.render('freelancers/index', { freelancers: [], categories: [], currentCategory: null, user: res.locals.user });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.redirect('/freelancers');
  try {
    const [users] = await db.query('SELECT id, name, bio, role FROM users WHERE id = ? AND role IN (\'freelancer\', \'both\')', [id]);
    if (!users?.length) return res.redirect('/freelancers');
    const [reviews] = await db.query(
      `SELECT r.rating, r.comment, r.created_at, u.name as reviewer_name
       FROM reviews r JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT 20`,
      [id]
    );
    const [[stats]] = await db.query(
      `SELECT COUNT(DISTINCT pr.project_id) as projects_done, COALESCE(SUM(pr.amount), 0) as total_earned
       FROM proposals pr WHERE pr.freelancer_id = ? AND pr.status = 'accepted'`,
      [id]
    );
    const avgRating = reviews?.length
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;
    res.render('freelancers/show', {
      freelancer: users[0],
      reviews: reviews || [],
      stats: stats || { projects_done: 0, total_earned: 0 },
      avgRating,
      user: res.locals.user,
    });
  } catch (e) {
    res.redirect('/freelancers');
  }
});

module.exports = router;
