const { app, request, signUp } = require('./helpers');

describe('auth', () => {
  test('register logs the user in and never returns the password hash', async () => {
    const { agent, user } = await signUp('Ali Khan');

    expect(user).toMatchObject({ name: 'Ali Khan', email: 'user1@example.com' });
    expect(user).not.toHaveProperty('password_hash');

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.id).toBe(user.id);
  });

  test('register rejects invalid input and strips HTML from the name', async () => {
    const bad = await request(app).post('/api/auth/register').send({ name: 'A', email: 'nope', password: 'short' });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/email must be a valid email/);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '<b>Sara</b><script>alert(1)</script>', email: 'sara@example.com', password: 'password123' })
      .expect(201);
    expect(res.body.user.name).toBe('Sara');
  });

  test('register rejects a duplicate email, case-insensitively', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sara', email: 'sara@example.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sara 2', email: 'SARA@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('login, logout and the session cookie', async () => {
    const { user } = await signUp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: user.email, password: 'wrong-password' }).expect(401);

    const login = await agent.post('/api/auth/login').send({ email: user.email, password: 'password123' }).expect(200);
    const cookie = login.headers['set-cookie'][0];
    expect(cookie).toMatch(/^ttm\.sid=/);
    expect(cookie).toMatch(/HttpOnly/);

    await agent.get('/api/auth/me').expect(200);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  test('protected routes require a session', async () => {
    await request(app).get('/api/teams').expect(401);
    await request(app).get('/api/tasks').expect(401);
    await request(app).get('/api/invites').expect(401);
  });
});
