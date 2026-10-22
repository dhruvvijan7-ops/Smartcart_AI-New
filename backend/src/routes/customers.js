const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM oltp.customers ORDER BY name`);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM oltp.customers WHERE id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, city } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.customers (name,email,phone,city) VALUES($1,$2,$3,$4) RETURNING *`,
      [name, email, phone, city]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone, city } = req.body;
    const result = await db.query(
      `UPDATE oltp.customers SET name=$1,email=$2,phone=$3,city=$4 WHERE id=$5 RETURNING *`,
      [name, email, phone, city, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM oltp.customers WHERE id=$1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
