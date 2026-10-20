// Central error handler: every error ends up here with one response shape.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Postgres unique violation (e.g. email already registered)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  return res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
  });
};