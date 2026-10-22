// Runs every .sql file in /migrations once, in filename order.
// Usage: npm run migrate (also runs on container start in production, and before the tests)
const fs = require('fs');
const path = require('path');

// Any constant works; it just has to be the same for every app instance
const MIGRATION_LOCK_ID = 727272;

async function migrate(pool, log = console.log) {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  const client = await pool.connect();
  try {
    // If several instances start at once, only one runs migrations at a time
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);

    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (filename VARCHAR(255) PRIMARY KEY, run_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'
    );
    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    const done = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (done.has(file)) {
        log(`skip  ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        log(`ran   ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]).catch(() => {});
    client.release();
  }
}

module.exports = { migrate };

// Run directly: node scripts/migrate.js
if (require.main === module) {
  require('dotenv').config({ quiet: true });
  const { pool } = require('../src/config/db');

  migrate(pool)
    .then(() => {
      console.log('Migrations complete');
      return pool.end();
    })
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exit(1);
    });
}