const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT da.*, p.name as product_name, p.category
      FROM oltp.discount_actions da
      JOIN oltp.products p ON da.product_id = p.id
      ORDER BY da.applied_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, discount_pct, strategy } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.discount_actions (product_id, discount_pct, strategy) VALUES($1,$2,$3) RETURNING *`,
      [product_id, discount_pct, strategy || 'manual']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id/resolve', async (req, res, next) => {
  try {
    const { reward, sell_through_qty, outcome } = req.body;
    const result = await db.query(
      `UPDATE oltp.discount_actions SET reward=$1, sell_through_qty=$2, outcome=$3, resolved_at=NOW() WHERE id=$4 RETURNING *`,
      [reward, sell_through_qty, outcome, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
