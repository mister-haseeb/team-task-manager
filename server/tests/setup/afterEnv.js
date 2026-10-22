// Every test starts from empty tables; the pool is closed when a file finishes.
const { pool } = require('../../src/config/db');

beforeEach(async () => {
  await pool.query('TRUNCATE users, teams, team_members, tasks, invites RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});
