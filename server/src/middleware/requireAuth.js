// Blocks the request unless the user has a valid login session.
module.exports = function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Please log in to continue' });
};
