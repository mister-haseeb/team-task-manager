// Builds the Express app (kept separate from server.js so it's easy to test).
const express = require('express');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

module.exports = app;