const Joi = require('joi');
const { email, id } = require('./common');

const createInviteSchema = Joi.object({
  email: email.required(),
});

const tokenParamsSchema = Joi.object({
  token: Joi.string().hex().length(48).required(),
});

const teamInviteParamsSchema = Joi.object({
  teamId: id.required(),
  inviteId: id.required(),
});

module.exports = { createInviteSchema, tokenParamsSchema, teamInviteParamsSchema };
