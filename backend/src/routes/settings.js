const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM oltp.settings ORDER BY key`);
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) { next(err); }
});

router.put('/:key', async (req, res, next) => {
  try {
    const { value } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.settings (key, value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW() RETURNING *`,
      [req.params.key, value]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
