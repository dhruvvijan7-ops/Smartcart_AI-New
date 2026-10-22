const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT ra.*, p.name as product_name, p.category
      FROM oltp.reorder_actions ra
      JOIN oltp.products p ON ra.product_id = p.id
      ORDER BY ra.created_at DESC LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, suggested_qty, reason, auto_executed } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.reorder_actions (product_id, suggested_qty, reason, auto_executed) VALUES($1,$2,$3,$4) RETURNING *`,
      [product_id, suggested_qty, reason, auto_executed || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      `UPDATE oltp.reorder_actions SET status=$1 WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
