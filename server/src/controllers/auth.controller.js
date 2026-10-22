const passport = require('passport');
const userService = require('../services/user.service');

// req.login wrapped in a promise (it also regenerates the session id).
const logIn = (req, user) =>
  new Promise((resolve, reject) => req.login(user, (err) => (err ? reject(err) : resolve())));

async function register(req, res) {
  const user = await userService.createUser(req.validated.body);
  await logIn(req, user);
  res.status(201).json({ user });
}

function login(req, res, next) {
  // Passport reads the credentials from req.body, so hand it the validated values
  req.body = req.validated.body;

  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });
    try {
      await logIn(req, user);
      return res.json({ user });
    } catch (loginErr) {
      return next(loginErr);
    }
  })(req, res, next);
}

function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    return req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('ttm.sid');
      return res.status(204).end();
    });
  });
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, logout, me };
