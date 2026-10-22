const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT r.*, s.product_id FROM oltp.receipts r JOIN oltp.sales s ON r.sale_id = s.id ORDER BY r.issued_at DESC LIMIT 100`);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { sale_id, total_amount, payment_method } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.receipts (sale_id, total_amount, payment_method) VALUES($1,$2,$3) RETURNING *`,
      [sale_id, total_amount, payment_method || 'cash']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
