// Tasks. A user can only see and change tasks in teams they belong to.
const db = require('../config/db');
const teamService = require('./team.service');
const httpError = require('../utils/httpError');

// Task row plus team/assignee/creator names, limited to teams the user ($1) is in.
const TASK_SELECT = `
  SELECT t.id, t.team_id, t.title, t.description, t.status, t.priority, t.due_date,
         t.assignee_id, t.created_by, t.created_at, t.updated_at,
         team.name AS team_name, me.role AS my_role,
         assignee.name AS assignee_name, creator.name AS creator_name
  FROM tasks t
  JOIN team_members me ON me.team_id = t.team_id AND me.user_id = $1
  JOIN teams team ON team.id = t.team_id
  LEFT JOIN users assignee ON assignee.id = t.assignee_id
  JOIN users creator ON creator.id = t.created_by`;

// API field name -> column name, for the fields a user may change.
const EDITABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  assigneeId: 'assignee_id',
};

// Escape LIKE wildcards so a search for "50%" matches literally.
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

async function listTasks(userId, { teamId, assigneeId, status, priority, search } = {}) {
  const { rows } = await db.query(
    `${TASK_SELECT}
     WHERE ($2::int IS NULL OR t.team_id = $2)
       AND ($3::int IS NULL OR t.assignee_id = $3)
       AND ($4::text IS NULL OR t.status = $4)
       AND ($5::text IS NULL OR t.priority = $5)
       AND ($6::text IS NULL OR t.title ILIKE $6 OR t.description ILIKE $6)
     ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`,
    [
      userId,
      teamId ?? null,
      assigneeId ?? null,
      status ?? null,
      priority ?? null,
      search ? `%${escapeLike(search)}%` : null,
    ]
  );
  return rows;
}

// Unfinished tasks assigned to the user that are overdue or due within `days` days.
async function listDueSoon(userId, days = 3) {
  const { rows } = await db.query(
    `${TASK_SELECT}
     WHERE t.assignee_id = $1
       AND t.status <> 'done'
       AND t.due_date IS NOT NULL
       AND t.due_date <= CURRENT_DATE + $2::int
     ORDER BY t.due_date ASC`,
    [userId, days]
  );
  return rows;
}

async function getTask(taskId, userId) {
  const { rows } = await db.query(`${TASK_SELECT} WHERE t.id = $2`, [userId, taskId]);
  if (!rows[0]) throw httpError(404, 'Task not found');
  return rows[0];
}

async function assertAssigneeInTeam(teamId, assigneeId) {
  if (assigneeId && !(await teamService.getRole(teamId, assigneeId))) {
    throw httpError(400, 'The assignee must be a member of the team');
  }
}

async function createTask(data, userId) {
  if (!(await teamService.getRole(data.teamId, userId))) throw httpError(404, 'Team not found');
  await assertAssigneeInTeam(data.teamId, data.assigneeId);

  const { rows } = await db.query(
    `INSERT INTO tasks (team_id, title, description, status, priority, due_date, assignee_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      data.teamId,
      data.title,
      data.description || null,
      data.status,
      data.priority,
      data.dueDate || null,
      data.assigneeId || null,
      userId,
    ]
  );
  return getTask(rows[0].id, userId);
}

// Any team member can update a task; only the given fields change.
async function updateTask(taskId, changes, userId) {
  const task = await getTask(taskId, userId);
  if ('assigneeId' in changes) await assertAssigneeInTeam(task.team_id, changes.assigneeId);

  const fields = Object.keys(changes).filter((key) => key in EDITABLE_COLUMNS);
  const setClause = fields.map((key, i) => `${EDITABLE_COLUMNS[key]} = $${i + 2}`).join(', ');
  const values = fields.map((key) => (changes[key] === '' ? null : changes[key]));

  await db.query(`UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = $1`, [taskId, ...values]);
  return getTask(taskId, userId);
}

// Only the task's creator or the team owner can delete it.
async function deleteTask(taskId, userId) {
  const task = await getTask(taskId, userId);
  if (task.created_by !== userId && task.my_role !== 'owner') {
    throw httpError(403, 'Only the task creator or the team owner can delete this task');
  }
  await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
}

module.exports = { listTasks, listDueSoon, getTask, createTask, updateTask, deleteTask };
