// Helpers for API tests. Each agent keeps its own session cookie, like a separate browser.
const request = require('supertest');
const app = require('../src/app');

let userCount = 0;

// Registers a new user and returns { agent, user } with the agent logged in.
async function signUp(name = 'Test User') {
  userCount += 1;
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/register')
    .send({ name, email: `user${userCount}@example.com`, password: 'password123' })
    .expect(201);
  return { agent, user: res.body.user };
}

// Creates a team owned by `owner` and adds the given members to it.
async function createTeam(owner, members = [], name = 'Team A') {
  const { body } = await owner.agent.post('/api/teams').send({ name }).expect(201);
  for (const member of members) {
    await owner.agent.post(`/api/teams/${body.team.id}/members`).send({ email: member.user.email }).expect(201);
  }
  return body.team;
}

// 'YYYY-MM-DD' for today plus `days`
const isoDate = (days = 0) => {
  const date = new Date(Date.now() + days * 86_400_000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

module.exports = { app, request, signUp, createTeam, isoDate };
