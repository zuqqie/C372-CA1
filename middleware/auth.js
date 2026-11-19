// Auth Middleware
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.send('Access Denied!');
}

// Admins manage the site; they do not keep journals or book services.
function blockAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  next();
}

module.exports = { isLoggedIn, isAdmin, blockAdmin };
