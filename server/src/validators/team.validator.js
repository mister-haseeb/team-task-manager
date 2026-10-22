const Joi = require('joi');
const { safeText, email, id } = require('./common');

const teamSchema = Joi.object({
  name: safeText().min(2).max(100).required(),
  description: safeText().max(1000).allow(''),
});

const addMemberSchema = Joi.object({
  email: email.required(),
});

const memberParamsSchema = Joi.object({
  teamId: id.required(),
  userId: id.required(),
});

module.exports = { teamSchema, addMemberSchema, memberParamsSchema };
