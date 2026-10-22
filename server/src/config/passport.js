// Passport setup: email + password login, with only the user id stored in the session.
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const userService = require('../services/user.service');

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await userService.verifyCredentials(email, password);
      if (!user) return done(null, false, { message: 'Invalid email or password' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    // false (not an error) when the user was deleted, so the stale session is simply ignored
    done(null, (await userService.findById(id)) || false);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
