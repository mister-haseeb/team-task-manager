// Team invites by email. The invitee accepts after logging in with that email.
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('./email.service');
const httpError = require('../utils/httpError');

async function createInvite(teamId, email, inviter) {
  const { rows: existing } = await db.query(
    `SELECT 1 FROM team_members m JOIN users u ON u.id = m.user_id
     WHERE m.team_id = $1 AND u.email = $2`,
    [teamId, email]
  );
  if (existing.length) throw httpError(409, 'This person is already a member of the team');

  const token = crypto.randomBytes(24).toString('hex');
  let invite;
  try {
    const { rows } = await db.query(
      `INSERT INTO invites (team_id, email, token, invited_by) VALUES ($1, $2, $3, $4)
       RETURNING id, team_id, email, status, created_at`,
      [teamId, email, token, inviter.id]
    );
    invite = rows[0];
  } catch (err) {
    if (err.code === '23505') throw httpError(409, 'This email already has a pending invite');
    throw err;
  }

  const { rows: teams } = await db.query('SELECT name FROM teams WHERE id = $1', [teamId]);
  await emailService.sendTeamInvite({
    to: email,
    teamName: teams[0].name,
    inviterName: inviter.name,
    // RENDER_EXTERNAL_URL is set automatically on Render
    acceptUrl: `${process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173'}/invites/${token}`,
  });
  return invite;
}

async function listPendingForTeam(teamId) {
  const { rows } = await db.query(
    `SELECT id, email, status, created_at FROM invites
     WHERE team_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
    [teamId]
  );
  return rows;
}

// Pending invites addressed to this user's email.
async function listPendingForUser(user) {
  const { rows } = await db.query(
    `SELECT i.id, i.token, i.created_at, t.id AS team_id, t.name AS team_name, u.name AS invited_by_name
     FROM invites i
     JOIN teams t ON t.id = i.team_id
     JOIN users u ON u.id = i.invited_by
     WHERE i.email = $1 AND i.status = 'pending'
     ORDER BY i.created_at DESC`,
    [user.email]
  );
  return rows;
}

async function findPendingInvite(token, user) {
  const { rows } = await db.query("SELECT * FROM invites WHERE token = $1 AND status = 'pending'", [token]);
  const invite = rows[0];
  // Same response whether the token is wrong or belongs to someone else
  if (!invite || invite.email !== user.email) throw httpError(404, 'Invite not found or already used');
  return invite;
}

async function acceptInvite(token, user) {
  const invite = await findPendingInvite(token, user);
  await db.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [invite.team_id, user.id]
    );
    await client.query("UPDATE invites SET status = 'accepted' WHERE id = $1", [invite.id]);
  });
  return { teamId: invite.team_id };
}

async function declineInvite(token, user) {
  const invite = await findPendingInvite(token, user);
  await db.query("UPDATE invites SET status = 'declined' WHERE id = $1", [invite.id]);
}

async function cancelInvite(teamId, inviteId) {
  const { rowCount } = await db.query(
    "DELETE FROM invites WHERE id = $1 AND team_id = $2 AND status = 'pending'",
    [inviteId, teamId]
  );
  if (!rowCount) throw httpError(404, 'Invite not found');
}

module.exports = {
  createInvite,
  listPendingForTeam,
  listPendingForUser,
  acceptInvite,
  declineInvite,
  cancelInvite,
};
