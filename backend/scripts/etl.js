/**
 * SmartCart AI — ETL Pipeline Script
 * Extracts data from PostgreSQL OLTP schema and loads into Star-Schema Data Warehouse
 */
const path = require('path');
const { Pool } = require('pg');
const dotenv = require(path.join(__dirname, '../node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runETL() {
  console.log('🚀 Starting SmartCart AI ETL Pipeline...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Sync dim_product from oltp.products
    console.log('📦 Syncing dim_product...');
    await client.query(`
      INSERT INTO warehouse.dim_product (product_id, name, sku, unit, expiry_days)
      SELECT id, name, sku, unit, expiry_days
      FROM oltp.products
      ON CONFLICT DO NOTHING
    `);

    // 2. Sync dim_category from oltp.products
    console.log('🏷️ Syncing dim_category...');
    await client.query(`
      INSERT INTO warehouse.dim_category (name, parent_category)
      SELECT DISTINCT category, 'General'
      FROM oltp.products
      ON CONFLICT DO NOTHING
    `);

    // 3. Populate fact_waste_events from stock near-expiry / wasted items
    console.log('📊 Populating fact_waste_events...');
    await client.query(`
      INSERT INTO warehouse.fact_waste_events (date_id, product_sk, category_sk, store_sk, quantity_wasted, loss_value, risk_score, discount_applied, reason)
      SELECT 
        CURRENT_DATE as date_id,
        dp.product_sk,
        dc.category_sk,
        1 as store_sk,
        st.quantity_on_hand as quantity_wasted,
        (st.quantity_on_hand * p.unit_cost) as loss_value,
        95.0 as risk_score,
        0.0 as discount_applied,
        'near_expiry_unsold' as reason
      FROM oltp.stock st
      JOIN oltp.products p ON st.product_id = p.id
      JOIN warehouse.dim_product dp ON p.id = dp.product_id
      JOIN warehouse.dim_category dc ON p.category = dc.name
      WHERE st.expiry_date <= CURRENT_DATE + 2
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ ETL Pipeline completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ETL Pipeline failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runETL();
