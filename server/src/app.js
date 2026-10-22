// Builds the Express app (kept separate from server.js so it's easy to test).
const fs = require('fs');
const path = require('path');
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

// In production the built React app (client/dist) is served from the same origin as the API
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Let React Router handle every other page (e.g. /login after a refresh)
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(clientDist, 'index.html')) : next()));
}

app.use(errorHandler);

module.exports = app;
