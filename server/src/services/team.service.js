// Teams and their members. Access checks live in middleware/teamAccess.js.
const db = require('../config/db');
const userService = require('./user.service');
const httpError = require('../utils/httpError');

// Teams the user belongs to, with their role and the member count.
async function listForUser(userId) {
  const { rows } = await db.query(
    `SELECT t.id, t.name, t.description, t.owner_id, t.created_at, me.role,
            (SELECT COUNT(*)::int FROM team_members m WHERE m.team_id = t.id) AS member_count
     FROM teams t
     JOIN team_members me ON me.team_id = t.id AND me.user_id = $1
     ORDER BY t.name`,
    [userId]
  );
  return rows;
}

// The user's role in the team ('owner' | 'member'), or null if not a member.
async function getRole(teamId, userId) {
  const { rows } = await db.query('SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [
    teamId,
    userId,
  ]);
  return rows[0]?.role || null;
}

async function createTeam({ name, description }, ownerId) {
  return db.withTransaction(async (client) => {
    const { rows } = await client.query(
      'INSERT INTO teams (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, ownerId]
    );
    const team = rows[0];
    await client.query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')", [
      team.id,
      ownerId,
    ]);
    return { ...team, role: 'owner', member_count: 1 };
  });
}

async function getTeam(teamId) {
  const { rows } = await db.query('SELECT * FROM teams WHERE id = $1', [teamId]);
  if (!rows[0]) throw httpError(404, 'Team not found');
  return { ...rows[0], members: await listMembers(teamId) };
}

async function updateTeam(teamId, { name, description }) {
  const { rows } = await db.query('UPDATE teams SET name = $2, description = $3 WHERE id = $1 RETURNING *', [
    teamId,
    name,
    description || null,
  ]);
  return rows[0];
}

async function deleteTeam(teamId) {
  // Members, tasks and invites are removed by ON DELETE CASCADE
  await db.query('DELETE FROM teams WHERE id = $1', [teamId]);
}

async function listMembers(teamId) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, m.role, m.joined_at
     FROM team_members m JOIN users u ON u.id = m.user_id
     WHERE m.team_id = $1
     ORDER BY m.role DESC, u.name`,
    [teamId]
  );
  return rows;
}

// Adds an existing user (looked up by email) to the team.
async function addMember(teamId, email) {
  const user = await userService.findByEmail(email);
  if (!user) throw httpError(404, 'No account found with that email. Send them an invite instead.');

  try {
    await db.query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')", [
      teamId,
      user.id,
    ]);
  } catch (err) {
    if (err.code === '23505') throw httpError(409, 'This user is already a member of the team');
    throw err;
  }
  return { ...user, role: 'member' };
}

async function removeMember(teamId, userId) {
  const role = await getRole(teamId, userId);
  if (!role) throw httpError(404, 'This user is not a member of the team');
  if (role === 'owner') throw httpError(400, 'The team owner cannot be removed');

  await db.withTransaction(async (client) => {
    // Their tasks in this team stay, but become unassigned
    await client.query('UPDATE tasks SET assignee_id = NULL WHERE team_id = $1 AND assignee_id = $2', [
      teamId,
      userId,
    ]);
    await client.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId]);
  });
}

module.exports = {
  listForUser,
  getRole,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  listMembers,
  addMember,
  removeMember,
};
