/**
 * SmartCart AI — Database Runner Script
 * Runs OLTP schema, warehouse schema, and seed data against Neon PostgreSQL
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runFile(filePath, label) {
  console.log(`\n▶ Running ${label}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    await pool.query(sql);
    console.log(`✅ ${label} completed successfully`);
  } catch (err) {
    console.error(`❌ ${label} failed:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('🚀 SmartCart AI — Database Setup');
  console.log('📡 Connecting to Neon PostgreSQL...\n');

  try {
    await pool.query('SELECT 1'); // test connection
    console.log('✅ Connected to Neon PostgreSQL\n');

    const schemaDir = path.join(__dirname, '../schema');
    const seedDir = path.join(__dirname, '../seeds');

    await runFile(path.join(schemaDir, 'oltp.sql'), 'OLTP Schema');
    await runFile(path.join(schemaDir, 'warehouse.sql'), 'Warehouse Schema');
    await runFile(path.join(seedDir, 'seed.sql'), 'Seed Data');

    console.log('\n🎉 Database setup complete!');
    console.log('📊 Tables created: stores, suppliers, products, customers,');
    console.log('   stock, purchases, sales, receipts, payments, settings,');
    console.log('   notifications, audit_log, discount_actions, reorder_actions');
    console.log('   + warehouse: dim_time, dim_product, dim_category, dim_store, fact_waste_events');
    console.log('\n✅ Ready to start the backend server\n');
  } catch (err) {
    console.error('\n💥 Setup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
