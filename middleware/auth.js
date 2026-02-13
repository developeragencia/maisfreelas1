'use strict';

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  const back = req.originalUrl && req.originalUrl.startsWith('/') && !req.originalUrl.startsWith('//')
    ? encodeURIComponent(req.originalUrl) : '';
  res.redirect(back ? '/login?redirect=' + back : '/login');
}

function requireGuest(req, res, next) {
  if (req.session && req.session.userId) return res.redirect('/dashboard');
  next();
}

module.exports = { requireAuth, requireGuest };
