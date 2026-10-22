const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT s.*, COUNT(p.id) as product_count
      FROM oltp.suppliers s
      LEFT JOIN oltp.products p ON s.id = p.supplier_id
      GROUP BY s.id ORDER BY s.name
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM oltp.suppliers WHERE id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, contact_email, contact_phone, city, lead_time_days, reliability_score } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.suppliers (name,contact_email,contact_phone,city,lead_time_days,reliability_score) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, contact_email, contact_phone, city, lead_time_days, reliability_score]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, contact_email, contact_phone, city, lead_time_days, reliability_score } = req.body;
    const result = await db.query(
      `UPDATE oltp.suppliers SET name=$1,contact_email=$2,contact_phone=$3,city=$4,lead_time_days=$5,reliability_score=$6 WHERE id=$7 RETURNING *`,
      [name, contact_email, contact_phone, city, lead_time_days, reliability_score, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM oltp.suppliers WHERE id=$1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
