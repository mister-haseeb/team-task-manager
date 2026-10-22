// Runs once before all tests: creates the test database if needed and applies migrations.
const { Client, Pool } = require('pg');
const { testDatabaseUrl } = require('./testDatabaseUrl');
const { migrate } = require('../../scripts/migrate');

module.exports = async function globalSetup() {
  const url = new URL(testDatabaseUrl());
  const dbName = url.pathname.slice(1);

  // Connect to the default "postgres" database to create the test database
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();

  const pool = new Pool({ connectionString: url.toString() });
  await migrate(pool, () => {});
  await pool.end();
};
