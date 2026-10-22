// Runs in every test file before the app is loaded.
const { testDatabaseUrl } = require('./testDatabaseUrl');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.SESSION_STORE = 'memory';
process.env.SESSION_SECRET = 'test-secret';
process.env.BCRYPT_ROUNDS = '4';
