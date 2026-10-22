// User accounts: creation (with bcrypt hashing) and lookups.
const bcrypt = require('bcrypt');
const db = require('../config/db');
const httpError = require('../utils/httpError');

const SALT_ROUNDS = 12;
const PUBLIC_COLUMNS = 'id, name, email, created_at';

async function createUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING ${PUBLIC_COLUMNS}`,
      [name, email, passwordHash]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw httpError(409, 'An account with this email already exists');
    throw err;
  }
}

// Returns the user only if the password matches, otherwise null.
async function verifyCredentials(email, password) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`, [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;

  const { password_hash: _hash, ...publicUser } = user;
  return publicUser;
}

async function findById(id) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = $1`, [email]);
  return rows[0] || null;
}

module.exports = { createUser, verifyCredentials, findById, findByEmail };
