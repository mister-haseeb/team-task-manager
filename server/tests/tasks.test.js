const { signUp, createTeam, isoDate } = require('./helpers');

describe('tasks', () => {
  let owner;
  let member;
  let team;

  beforeEach(async () => {
    owner = await signUp('Owner');
    member = await signUp('Member');
    team = await createTeam(owner, [member]);
  });

  const createTask = (who, fields) =>
    who.agent
      .post('/api/tasks')
      .send({ teamId: team.id, ...fields })
      .expect(201)
      .then((res) => res.body.task);

  test('create uses defaults and keeps due dates as plain dates', async () => {
    const task = await createTask(owner, { title: 'Plan sprint', dueDate: '2030-01-15', assigneeId: member.user.id });

    expect(task).toMatchObject({
      title: 'Plan sprint',
      status: 'todo',
      priority: 'medium',
      due_date: '2030-01-15',
      assignee_name: 'Member',
      team_name: team.name,
    });
  });

  test('validates fields and requires the assignee to be in the team', async () => {
    const outsider = await signUp();

    const invalid = await owner.agent
      .post('/api/tasks')
      .send({ teamId: team.id, title: '', status: 'blocked', dueDate: '15/01/2030' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toMatch(/title/);
    expect(invalid.body.error).toMatch(/status/);
    expect(invalid.body.error).toMatch(/dueDate/);

    await owner.agent.post('/api/tasks').send({ teamId: team.id, title: 'X', assigneeId: outsider.user.id }).expect(400);
    await outsider.agent.post('/api/tasks').send({ teamId: team.id, title: 'Sneaky' }).expect(404);
  });

  test('filters by team, assignee, status, priority and search', async () => {
    const otherTeam = await createTeam(owner, [], 'Team B');
    await createTask(owner, { title: 'Fix login bug', assigneeId: member.user.id, priority: 'high' });
    await createTask(owner, { title: 'Write release notes', description: 'Mention the 50% speedup', status: 'done' });
    await owner.agent.post('/api/tasks').send({ teamId: otherTeam.id, title: 'Other team task' }).expect(201);

    const titles = async (query) => {
      const { body } = await owner.agent.get('/api/tasks').query(query).expect(200);
      return body.tasks.map((t) => t.title);
    };

    expect(await titles({ teamId: team.id })).toEqual(['Fix login bug', 'Write release notes']);
    expect(await titles({ assigneeId: member.user.id })).toEqual(['Fix login bug']);
    expect(await titles({ status: 'done' })).toEqual(['Write release notes']);
    expect(await titles({ priority: 'high' })).toEqual(['Fix login bug']);
    expect(await titles({ search: 'LOGIN' })).toEqual(['Fix login bug']);
    expect(await titles({ search: '50%' })).toEqual(['Write release notes']); // % is matched literally
    expect(await titles({ search: '%' })).toEqual(['Write release notes']);
  });

  test('users only see tasks from their own teams', async () => {
    const outsider = await signUp();
    const task = await createTask(owner, { title: 'Private' });

    const { body } = await outsider.agent.get('/api/tasks').expect(200);
    expect(body.tasks).toEqual([]);
    await outsider.agent.get(`/api/tasks/${task.id}`).expect(404);
    await outsider.agent.patch(`/api/tasks/${task.id}`).send({ status: 'done' }).expect(404);
  });

  test('any member can update a task; changing only the given fields', async () => {
    const task = await createTask(owner, { title: 'Draft', priority: 'low', dueDate: '2030-01-15' });

    const { body } = await member.agent
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'in_progress', dueDate: '', assigneeId: member.user.id })
      .expect(200);

    expect(body.task).toMatchObject({ title: 'Draft', priority: 'low', status: 'in_progress', due_date: null });
    expect(body.task.assignee_id).toBe(member.user.id);
    await member.agent.patch(`/api/tasks/${task.id}`).send({}).expect(400);
  });

  test('only the creator or the team owner can delete a task', async () => {
    const ownersTask = await createTask(owner, { title: 'Owner task' });
    const membersTask = await createTask(member, { title: 'Member task' });
    const third = await signUp();
    await owner.agent.post(`/api/teams/${team.id}/members`).send({ email: third.user.email }).expect(201);

    await member.agent.delete(`/api/tasks/${ownersTask.id}`).expect(403);
    await third.agent.delete(`/api/tasks/${membersTask.id}`).expect(403);
    await member.agent.delete(`/api/tasks/${membersTask.id}`).expect(204);
    await owner.agent.delete(`/api/tasks/${ownersTask.id}`).expect(204);
  });

  test('reminders list my unfinished tasks that are overdue or due within 3 days', async () => {
    const mine = { assigneeId: member.user.id };
    await createTask(owner, { ...mine, title: 'Overdue', dueDate: isoDate(-2) });
    await createTask(owner, { ...mine, title: 'Due today', dueDate: isoDate(0) });
    await createTask(owner, { ...mine, title: 'Due in 3 days', dueDate: isoDate(3) });
    await createTask(owner, { ...mine, title: 'Due in 5 days', dueDate: isoDate(5) });
    await createTask(owner, { ...mine, title: 'Done', dueDate: isoDate(1), status: 'done' });
    await createTask(owner, { title: 'Someone else', dueDate: isoDate(1) });

    const { body } = await member.agent.get('/api/tasks/reminders').expect(200);
    expect(body.tasks.map((t) => t.title)).toEqual(['Overdue', 'Due today', 'Due in 3 days']);
  });
});
