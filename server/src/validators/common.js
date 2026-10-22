// Joi building blocks shared by every validator.
const Joi = require('joi');
const xss = require('xss');

// Strip all HTML tags (and the contents of <script>/<style>) from user text.
const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] };

// Trimmed string with HTML removed. Chain .min()/.max()/.required() as usual.
const safeText = () => Joi.string().trim().custom((value) => xss.filterXSS(value, xssOptions));

const id = Joi.number().integer().positive();

const email = Joi.string().trim().lowercase().email().max(255);

const idParam = (name) => Joi.object({ [name]: id.required() });

module.exports = { safeText, id, email, idParam };
