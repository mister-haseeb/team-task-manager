// Mounts every API router under /api.
const express = require('express');
const authRoutes = require('./auth.routes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);

module.exports = router;
