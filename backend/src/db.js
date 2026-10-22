require('dotenv').config();
const { Pool } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartcart';

const pool = new Pool({
  connectionString: DB_URL,
  ssl: DB_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.warn('PostgreSQL pool notice:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
