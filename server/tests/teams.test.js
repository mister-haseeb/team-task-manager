const { signUp, createTeam } = require('./helpers');

describe('teams', () => {
  test('the creator becomes owner and sees the team in their list', async () => {
    const owner = await signUp();
    const team = await createTeam(owner, [], 'Website');

    expect(team).toMatchObject({ name: 'Website', role: 'owner', member_count: 1 });
    const { body } = await owner.agent.get('/api/teams').expect(200);
    expect(body.teams.map((t) => t.name)).toEqual(['Website']);
  });

  test('the owner adds members by email', async () => {
    const owner = await signUp();
    const member = await signUp();
    const team = await createTeam(owner, [member]);

    const { body } = await member.agent.get(`/api/teams/${team.id}`).expect(200);
    expect(body.team.role).toBe('member');
    expect(body.team.members.map((m) => m.id).sort()).toEqual([owner.user.id, member.user.id].sort());

    await owner.agent.post(`/api/teams/${team.id}/members`).send({ email: member.user.email }).expect(409);
    await owner.agent.post(`/api/teams/${team.id}/members`).send({ email: 'nobody@example.com' }).expect(404);
  });

  test('non-members cannot see that a team exists', async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const team = await createTeam(owner);

    await outsider.agent.get(`/api/teams/${team.id}`).expect(404);
    await outsider.agent.delete(`/api/teams/${team.id}`).expect(404);
  });

  describe('role-based access', () => {
    test('only the owner can edit or delete the team and manage members', async () => {
      const owner = await signUp();
      const member = await signUp();
      const other = await signUp();
      const team = await createTeam(owner, [member]);

      await member.agent.put(`/api/teams/${team.id}`).send({ name: 'Renamed' }).expect(403);
      await member.agent.delete(`/api/teams/${team.id}`).expect(403);
      await member.agent.post(`/api/teams/${team.id}/members`).send({ email: other.user.email }).expect(403);
      await member.agent.delete(`/api/teams/${team.id}/members/${owner.user.id}`).expect(403);

      await owner.agent.put(`/api/teams/${team.id}`).send({ name: 'Renamed' }).expect(200);
      await owner.agent.delete(`/api/teams/${team.id}`).expect(204);
      await owner.agent.get(`/api/teams/${team.id}`).expect(404);
    });

    test('a member can leave, but the owner cannot be removed', async () => {
      const owner = await signUp();
      const member = await signUp();
      const team = await createTeam(owner, [member]);

      await owner.agent.delete(`/api/teams/${team.id}/members/${owner.user.id}`).expect(400);
      await member.agent.delete(`/api/teams/${team.id}/members/${member.user.id}`).expect(204);
      await member.agent.get(`/api/teams/${team.id}`).expect(404);
    });
  });

  test('removing a member unassigns their tasks in that team', async () => {
    const owner = await signUp();
    const member = await signUp();
    const team = await createTeam(owner, [member]);
    const { body } = await owner.agent
      .post('/api/tasks')
      .send({ teamId: team.id, title: 'Write docs', assigneeId: member.user.id })
      .expect(201);

    await owner.agent.delete(`/api/teams/${team.id}/members/${member.user.id}`).expect(204);

    const task = await owner.agent.get(`/api/tasks/${body.task.id}`).expect(200);
    expect(task.body.task.assignee_id).toBeNull();
  });
});
