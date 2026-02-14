'use strict';
const db = require('../config/db');

async function create(userId, type, title, body = null, link = null) {
  if (!userId || !type || !title) return;
  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
      [userId, String(type).slice(0, 50), String(title).slice(0, 255), body ? String(body).slice(0, 2000) : null, link ? String(link).slice(0, 500) : null]
    );
  } catch (e) {
    console.error('Notification create:', e.message);
  }
}

async function getUnreadCount(userId) {
  if (!userId) return 0;
  try {
    const [rows] = await db.query('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read_at IS NULL', [userId]);
    return (rows && rows[0] && rows[0].c) || 0;
  } catch (e) {
    return 0;
  }
}

async function getForUser(userId, limit = 30) {
  if (!userId) return [];
  try {
    const [rows] = await db.query(
      'SELECT id, type, title, body, link, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, Math.min(Number(limit) || 30, 100)]
    );
    return rows || [];
  } catch (e) {
    return [];
  }
}

async function markRead(notificationId, userId) {
  if (!notificationId || !userId) return;
  try {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?', [notificationId, userId]);
  } catch (e) {
    console.error('Notification markRead:', e.message);
  }
}

async function markAllRead(userId) {
  if (!userId) return;
  try {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL', [userId]);
  } catch (e) {
    console.error('Notification markAllRead:', e.message);
  }
}

module.exports = { create, getUnreadCount, getForUser, markRead, markAllRead };
