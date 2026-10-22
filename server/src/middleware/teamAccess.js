// Role-based access to a team, read from the :teamId route param.
// Non-members get 404 so they can't discover which teams exist.
const teamService = require('../services/team.service');

function requireTeamRole(...allowedRoles) {
  return async (req, res, next) => {
    const teamId = Number(req.params.teamId);
    const role = Number.isInteger(teamId) ? await teamService.getRole(teamId, req.user.id) : null;

    if (!role) return res.status(404).json({ error: 'Team not found' });
    if (allowedRoles.length && !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Only the team owner can do this' });
    }

    req.team = { id: teamId, role };
    return next();
  };
}

module.exports = {
  requireTeamMember: requireTeamRole(),
  requireTeamOwner: requireTeamRole('owner'),
};
