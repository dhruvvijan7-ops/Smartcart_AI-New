const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT st.*, p.name as product_name, p.category, p.unit, p.expiry_days, p.reorder_threshold,
        CASE 
          WHEN st.expiry_date <= CURRENT_DATE THEN 'Critical'
          WHEN st.expiry_date <= CURRENT_DATE + (p.expiry_days * 0.25)::int THEN 'Critical'
          WHEN st.expiry_date <= CURRENT_DATE + (p.expiry_days * 0.5)::int THEN 'High'
          WHEN st.expiry_date <= CURRENT_DATE + (p.expiry_days * 0.75)::int THEN 'Warning'
          ELSE 'Good'
        END as risk_tier,
        (st.expiry_date - CURRENT_DATE) as days_to_expiry
      FROM oltp.stock st
      JOIN oltp.products p ON st.product_id = p.id
      ORDER BY st.expiry_date ASC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { quantity_on_hand, expiry_date, batch_id } = req.body;
    const result = await db.query(
      `UPDATE oltp.stock SET quantity_on_hand=$1, expiry_date=$2, batch_id=$3, last_updated=NOW() WHERE id=$4 RETURNING *`,
      [quantity_on_hand, expiry_date, batch_id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, store_id, quantity_on_hand, expiry_date, batch_id } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.stock (product_id, store_id, quantity_on_hand, expiry_date, batch_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT (product_id, store_id, batch_id) DO UPDATE SET quantity_on_hand=$3, expiry_date=$4, last_updated=NOW() RETURNING *`,
      [product_id, store_id || 1, quantity_on_hand, expiry_date, batch_id || 'DEFAULT']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
