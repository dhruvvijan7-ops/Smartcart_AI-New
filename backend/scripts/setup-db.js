require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

async function runFile(filePath, label) {
  console.log(`\n▶ ${label}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
  console.log(`✅ ${label} done`);
}

async function main() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to Neon\n');
    await runFile(path.join(__dirname, '../../database/schema/oltp.sql'), 'OLTP Schema');
    await runFile(path.join(__dirname, '../../database/schema/warehouse.sql'), 'Warehouse Schema');
    await runFile(path.join(__dirname, '../../database/schema/dataset.sql'), 'Dataset Schema');
    await runFile(path.join(__dirname, '../../database/seeds/seed.sql'), 'Seed Data');
    await runFile(path.join(__dirname, '../../database/seeds/seed-dataset-stores.sql'), 'Dataset Stores Seed');
    console.log('\n🎉 All done! SmartCart AI database is ready.');
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
main();
