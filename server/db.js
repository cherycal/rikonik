const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_PG18_URL,
  ssl: { rejectUnauthorized: false }
});

async function basicQuery(sql, params = []) {
  console.log("🔥 basicQuery CALLED with:", sql);
  return pool.query(sql, params);
}


module.exports = { basicQuery };