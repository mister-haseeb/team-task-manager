const taskService = require('../services/task.service');

async function list(req, res) {
  res.json({ tasks: await taskService.listTasks(req.user.id, req.validated.query) });
}

// Due-date reminders shown to the user after logging in.
async function reminders(req, res) {
  res.json({ tasks: await taskService.listDueSoon(req.user.id) });
}

async function get(req, res) {
  res.json({ task: await taskService.getTask(req.validated.params.taskId, req.user.id) });
}

async function create(req, res) {
  const task = await taskService.createTask(req.validated.body, req.user.id);
  res.status(201).json({ task });
}

async function update(req, res) {
  const task = await taskService.updateTask(req.validated.params.taskId, req.validated.body, req.user.id);
  res.json({ task });
}

async function remove(req, res) {
  await taskService.deleteTask(req.validated.params.taskId, req.user.id);
  res.status(204).end();
}

module.exports = { list, reminders, get, create, update, remove };
