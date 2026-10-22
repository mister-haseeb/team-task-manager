// Invites addressed to the logged-in user.
const express = require('express');
const validate = require('../middleware/validate');
const { tokenParamsSchema } = require('../validators/invite.validator');
const controller = require('../controllers/invite.controller');

const router = express.Router();
const validateToken = validate(tokenParamsSchema, 'params');

router.get('/', controller.listMine);
router.post('/:token/accept', validateToken, controller.accept);
router.post('/:token/decline', validateToken, controller.decline);

module.exports = router;
