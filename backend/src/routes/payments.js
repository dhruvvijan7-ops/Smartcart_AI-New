const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM oltp.payments ORDER BY paid_at DESC LIMIT 100`);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { receipt_id, amount, status } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.payments (receipt_id, amount, status) VALUES($1,$2,$3) RETURNING *`,
      [receipt_id, amount, status || 'completed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
