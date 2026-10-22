const teamService = require('../services/team.service');

async function list(req, res) {
  res.json({ teams: await teamService.listForUser(req.user.id) });
}

async function create(req, res) {
  const team = await teamService.createTeam(req.validated.body, req.user.id);
  res.status(201).json({ team });
}

async function get(req, res) {
  const team = await teamService.getTeam(req.team.id);
  res.json({ team: { ...team, role: req.team.role } });
}

async function update(req, res) {
  const team = await teamService.updateTeam(req.team.id, req.validated.body);
  res.json({ team });
}

async function remove(req, res) {
  await teamService.deleteTeam(req.team.id);
  res.status(204).end();
}

async function listMembers(req, res) {
  res.json({ members: await teamService.listMembers(req.team.id) });
}

async function addMember(req, res) {
  const member = await teamService.addMember(req.team.id, req.validated.body.email);
  res.status(201).json({ member });
}

// The owner can remove anyone else; a member can only remove themselves (leave).
async function removeMember(req, res) {
  const { userId } = req.validated.params;
  const isSelf = userId === req.user.id;

  if (req.team.role !== 'owner' && !isSelf) {
    return res.status(403).json({ error: 'Only the team owner can remove other members' });
  }
  await teamService.removeMember(req.team.id, userId);
  return res.status(204).end();
}

module.exports = { list, create, get, update, remove, listMembers, addMember, removeMember };
