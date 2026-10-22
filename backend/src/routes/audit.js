const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, action_type } = req.query;
    let query = `SELECT al.*, p.name as product_name FROM oltp.audit_log al LEFT JOIN oltp.products p ON al.entity = 'product' AND al.entity_id = p.id WHERE 1=1`;
    const params = [];
    if (action_type) { params.push(action_type); query += ` AND al.action_type = $${params.length}`; }
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { action_type, entity, entity_id, reason, model_used, outcome, trust_level } = req.body;
    const result = await db.query(
      `INSERT INTO oltp.audit_log (action_type, entity, entity_id, reason, model_used, outcome, trust_level) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [action_type, entity, entity_id, reason, model_used, outcome, trust_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
