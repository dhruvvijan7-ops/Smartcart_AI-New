const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT pu.*, p.name as product_name, s.name as supplier_name
      FROM oltp.purchases pu
      JOIN oltp.products p ON pu.product_id = p.id
      JOIN oltp.suppliers s ON pu.supplier_id = s.id
      ORDER BY pu.purchase_date DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, supplier_id, store_id, quantity, unit_cost, purchase_date, expected_delivery } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.purchases (product_id,supplier_id,store_id,quantity,unit_cost,purchase_date,expected_delivery) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [product_id, supplier_id, store_id || 1, quantity, unit_cost, purchase_date, expected_delivery]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { status, actual_delivery } = req.body;
    const result = await db.query(
      `UPDATE oltp.purchases SET status=$1, actual_delivery=$2 WHERE id=$3 RETURNING *`,
      [status, actual_delivery, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
