const express = require('express');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { createTaskSchema, updateTaskSchema, taskQuerySchema } = require('../validators/task.validator');
const controller = require('../controllers/task.controller');

const router = express.Router();
const validateTaskId = validate(idParam('taskId'), 'params');

// GET /api/tasks?teamId=&assigneeId=&status=&priority=&search=
router.get('/', validate(taskQuerySchema, 'query'), controller.list);
router.post('/', validate(createTaskSchema), controller.create);

router.get('/:taskId', validateTaskId, controller.get);
router.patch('/:taskId', validateTaskId, validate(updateTaskSchema), controller.update);
router.delete('/:taskId', validateTaskId, controller.remove);

module.exports = router;
