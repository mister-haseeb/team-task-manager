const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/requireAuth');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const controller = require('../controllers/auth.controller');

const router = express.Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
  // The test suite registers many users from one IP
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', credentialsLimiter, validate(registerSchema), controller.register);
router.post('/login', credentialsLimiter, validate(loginSchema), controller.login);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
