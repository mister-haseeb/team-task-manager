const inviteService = require('../services/invite.service');

// Team owner side (/api/teams/:teamId/invites)
async function create(req, res) {
  const invite = await inviteService.createInvite(req.team.id, req.validated.body.email, req.user);
  res.status(201).json({ invite });
}

async function listForTeam(req, res) {
  res.json({ invites: await inviteService.listPendingForTeam(req.team.id) });
}

async function cancel(req, res) {
  await inviteService.cancelInvite(req.team.id, req.validated.params.inviteId);
  res.status(204).end();
}

// Invitee side (/api/invites)
async function listMine(req, res) {
  res.json({ invites: await inviteService.listPendingForUser(req.user) });
}

async function accept(req, res) {
  res.json(await inviteService.acceptInvite(req.validated.params.token, req.user));
}

async function decline(req, res) {
  await inviteService.declineInvite(req.validated.params.token, req.user);
  res.status(204).end();
}

module.exports = { create, listForTeam, cancel, listMine, accept, decline };
