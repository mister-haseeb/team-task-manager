const { app, request, signUp, createTeam } = require('./helpers');

describe('invites', () => {
  let owner;
  let team;
  let logSpy;

  beforeEach(async () => {
    // The stubbed email service logs instead of sending; keep test output clean
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    owner = await signUp('Owner');
    team = await createTeam(owner);
  });

  afterEach(() => logSpy.mockRestore());

  const invite = (email) => owner.agent.post(`/api/teams/${team.id}/invites`).send({ email });

  test('the owner invites by email and the stub "sends" a link', async () => {
    const res = await invite('New.Person@example.com').expect(201);

    expect(res.body.invite).toMatchObject({ email: 'new.person@example.com', status: 'pending' });
    expect(res.body.invite).not.toHaveProperty('token');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[email stub] To: new.person@example.com'));

    await invite('new.person@example.com').expect(409); // already pending
    await invite(owner.user.email).expect(409); // already a member
  });

  test('the invitee accepts after signing up with the invited email', async () => {
    await invite('newbie@example.com').expect(201);
    const agent = request.agent(app);
    await agent
      .post('/api/auth/register')
      .send({ name: 'Newbie', email: 'newbie@example.com', password: 'password123' })
      .expect(201);

    const { body } = await agent.get('/api/invites').expect(200);
    expect(body.invites).toHaveLength(1);
    expect(body.invites[0]).toMatchObject({ team_id: team.id, invited_by_name: 'Owner' });

    await agent.post(`/api/invites/${body.invites[0].token}/accept`).expect(200);
    await agent.get(`/api/teams/${team.id}`).expect(200);
    await agent.post(`/api/invites/${body.invites[0].token}/accept`).expect(404); // already used
  });

  test("an invite can't be used by someone else", async () => {
    await invite('invited@example.com').expect(201);
    const invited = request.agent(app);
    await invited
      .post('/api/auth/register')
      .send({ name: 'Invited', email: 'invited@example.com', password: 'password123' })
      .expect(201);
    const { token } = (await invited.get('/api/invites')).body.invites[0];

    const intruder = await signUp();
    await intruder.agent.post(`/api/invites/${token}/accept`).expect(404);
    await intruder.agent.get(`/api/teams/${team.id}`).expect(404);
  });

  test('only the owner can send, list or cancel invites', async () => {
    const member = await signUp();
    await owner.agent.post(`/api/teams/${team.id}/members`).send({ email: member.user.email }).expect(201);

    await member.agent.post(`/api/teams/${team.id}/invites`).send({ email: 'x@example.com' }).expect(403);
    await member.agent.get(`/api/teams/${team.id}/invites`).expect(403);

    const { body } = await invite('x@example.com').expect(201);
    await owner.agent.delete(`/api/teams/${team.id}/invites/${body.invite.id}`).expect(204);
    const list = await owner.agent.get(`/api/teams/${team.id}/invites`).expect(200);
    expect(list.body.invites).toEqual([]);
  });
});
