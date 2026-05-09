const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function basicQuery(sql, params = []) {
  return pool.query(sql, params);
}

module.exports = { basicQuery };