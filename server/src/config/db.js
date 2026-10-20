// One shared PostgreSQL connection pool for the whole app.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres error:', err.message);
});

// Small helper so services can write: db.query(sql, params)
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };