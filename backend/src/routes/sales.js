const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { from, to, product_id } = req.query;
    let query = `
      SELECT sa.*, p.name as product_name, p.category,
        c.name as customer_name
      FROM oltp.sales sa
      JOIN oltp.products p ON sa.product_id = p.id
      LEFT JOIN oltp.customers c ON sa.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (from) { params.push(from); query += ` AND sa.sale_date >= $${params.length}`; }
    if (to) { params.push(to); query += ` AND sa.sale_date <= $${params.length}`; }
    if (product_id) { params.push(product_id); query += ` AND sa.product_id = $${params.length}`; }
    query += ' ORDER BY sa.sale_date DESC LIMIT 200';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, customer_id, store_id, quantity, unit_price, discount_applied } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.sales (product_id, customer_id, store_id, quantity, unit_price, discount_applied) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [product_id, customer_id, store_id || 1, quantity, unit_price, discount_applied || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
