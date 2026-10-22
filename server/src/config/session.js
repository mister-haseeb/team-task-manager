// Session middleware. Sessions are stored in PostgreSQL, with an in-memory
// fallback for local development (set SESSION_STORE=memory).
const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const MemoryStore = require('memorystore')(session);
const { pool } = require('./db');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

function createStore() {
  const storeType = process.env.SESSION_STORE || (isProduction ? 'postgres' : 'memory');

  if (storeType === 'memory') {
    if (isProduction) throw new Error('The in-memory session store must not be used in production');
    return new MemoryStore({ checkPeriod: ONE_DAY_MS });
  }
  // The "session" table is created by migrations/001_init.sql
  return new PgStore({ pool, tableName: 'session' });
}

function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && isProduction) throw new Error('SESSION_SECRET is required in production');

  return session({
    name: 'ttm.sid',
    secret: secret || 'dev-only-secret',
    store: createStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax',
      maxAge: 7 * ONE_DAY_MS,
    },
  });
}

module.exports = { createSessionMiddleware };
