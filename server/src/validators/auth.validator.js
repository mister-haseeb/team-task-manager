const Joi = require('joi');
const { safeText, email } = require('./common');

const registerSchema = Joi.object({
  name: safeText().min(2).max(100).required(),
  email: email.required(),
  // bcrypt only uses the first 72 bytes of a password
  password: Joi.string().min(8).max(72).required(),
});

const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().max(72).required(),
});

module.exports = { registerSchema, loginSchema };
