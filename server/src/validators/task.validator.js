const Joi = require('joi');
const { safeText, id } = require('./common');

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const fields = {
  title: safeText().min(1).max(200),
  description: safeText().max(5000).allow(''),
  status: Joi.string().valid(...STATUSES),
  priority: Joi.string().valid(...PRIORITIES),
  // Plain calendar date (YYYY-MM-DD); null or '' clears it
  dueDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .message('dueDate must be a date in YYYY-MM-DD format')
    .allow(null, ''),
  assigneeId: id.allow(null),
};

const createTaskSchema = Joi.object({
  ...fields,
  teamId: id.required(),
  title: fields.title.required(),
  status: fields.status.default('todo'),
  priority: fields.priority.default('medium'),
});

const updateTaskSchema = Joi.object(fields)
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update' });

const taskQuerySchema = Joi.object({
  teamId: id,
  assigneeId: id,
  status: fields.status,
  priority: fields.priority,
  search: safeText().max(100).allow(''),
});

module.exports = { createTaskSchema, updateTaskSchema, taskQuerySchema };
