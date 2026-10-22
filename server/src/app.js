// Builds the Express app (kept separate from server.js so it's easy to test).
const express = require('express');
const helmet = require('helmet');
const passport = require('./config/passport');
const { createSessionMiddleware } = require('./config/session');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Behind a proxy (Cloud Run) in production; needed for secure cookies and rate limiting
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(createSessionMiddleware());
app.use(passport.session());

app.use('/api', apiRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

app.use(errorHandler);

module.exports = app;
