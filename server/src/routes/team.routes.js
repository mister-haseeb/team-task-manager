const express = require('express');
const validate = require('../middleware/validate');
const { requireTeamMember, requireTeamOwner } = require('../middleware/teamAccess');
const { teamSchema, addMemberSchema, memberParamsSchema } = require('../validators/team.validator');
const { createInviteSchema, teamInviteParamsSchema } = require('../validators/invite.validator');
const controller = require('../controllers/team.controller');
const inviteController = require('../controllers/invite.controller');

const router = express.Router();

router.get('/', controller.list);
router.post('/', validate(teamSchema), controller.create);

router.get('/:teamId', requireTeamMember, controller.get);
router.put('/:teamId', requireTeamOwner, validate(teamSchema), controller.update);
router.delete('/:teamId', requireTeamOwner, controller.remove);

router.get('/:teamId/members', requireTeamMember, controller.listMembers);
router.post('/:teamId/members', requireTeamOwner, validate(addMemberSchema), controller.addMember);
router.delete(
  '/:teamId/members/:userId',
  requireTeamMember,
  validate(memberParamsSchema, 'params'),
  controller.removeMember
);

router.get('/:teamId/invites', requireTeamOwner, inviteController.listForTeam);
router.post('/:teamId/invites', requireTeamOwner, validate(createInviteSchema), inviteController.create);
router.delete(
  '/:teamId/invites/:inviteId',
  requireTeamOwner,
  validate(teamInviteParamsSchema, 'params'),
  inviteController.cancel
);

module.exports = router;
