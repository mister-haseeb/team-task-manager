const express = require('express');
const validate = require('../middleware/validate');
const { requireTeamMember, requireTeamOwner } = require('../middleware/teamAccess');
const { teamSchema, addMemberSchema, memberParamsSchema } = require('../validators/team.validator');
const controller = require('../controllers/team.controller');

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

module.exports = router;
