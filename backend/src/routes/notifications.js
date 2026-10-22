const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM oltp.notifications ORDER BY created_at DESC LIMIT 50`);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    const result = await db.query(`UPDATE oltp.notifications SET is_read=true WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/mark-all-read', async (req, res, next) => {
  try {
    await db.query(`UPDATE oltp.notifications SET is_read=true`);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { type, title, message } = req.body;
    const result = await db.query(`INSERT INTO oltp.notifications (type, title, message) VALUES($1,$2,$3) RETURNING *`, [type, title, message]);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM oltp.notifications WHERE id=$1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
