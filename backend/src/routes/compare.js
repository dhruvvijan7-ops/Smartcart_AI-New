'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();
const raw = (text, params) => db.pool.query(text, params);

router.get('/', async (req, res) => {
  try {
    const r = await raw(
      "SELECT payload, capabilities, computed_at FROM dataset.metrics WHERE scope='global' AND scope_id=0"
    );
    if (!r.rows.length) {
      const { recomputeGlobalMetrics } = require('../lib/datasetAnalytics');
      const fresh = await recomputeGlobalMetrics();
      return res.json(fresh);
    }
    res.json({
      ...r.rows[0].payload,
      capabilities: r.rows[0].capabilities,
      computed_at: r.rows[0].computed_at,
    });
  } catch (err) {
    console.error('[compare] error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
