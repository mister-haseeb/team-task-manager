// Mounts every API router under /api.
const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const authRoutes = require('./auth.routes');
const teamRoutes = require('./team.routes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);

// Everything below requires a logged-in user
router.use(requireAuth);
router.use('/teams', teamRoutes);

module.exports = router;
