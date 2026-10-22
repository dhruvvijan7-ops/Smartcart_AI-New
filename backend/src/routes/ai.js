const express = require('express');
const router = express.Router();
const db = require('../db');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function proxyToAI(path, body = null, method = 'GET') {
  const fetch = (await import('node-fetch')).default;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${AI_URL}${path}`, opts);
  if (!res.ok) throw new Error(`AI service error: ${res.status}`);
  return res.json();
}

// GET /api/ai/briefing
router.get('/briefing', async (req, res, next) => {
  try {
    const data = await proxyToAI('/briefing');
    res.json(data);
  } catch (err) {
    res.status(503).json({
      error: 'The AI microservice is offline. Start it on port 8000 to generate briefings.',
    });
  }
});

// POST /api/ai/chat — Executive AI Chatbot Endpoint
router.post('/chat', async (req, res, next) => {
  try {
    const { message, history = [], apiKey } = req.body;
    
    // Enrich with live store stats
    const productsRes = await db.query('SELECT name, category, zone, unit_price FROM oltp.products LIMIT 10');
    const storeContext = {
      active_store: 'SmartCart SuperMart Bengaluru',
      sample_critical: (productsRes.rows || []).slice(0, 4).map(p => p.name),
      timestamp: new Date().toISOString()
    };

    const data = await proxyToAI('/chat', {
      message,
      history,
      store_context: storeContext,
      api_key: apiKey
    }, 'POST');
    
    res.json(data);
  } catch (err) {
    res.status(503).json({
      error: 'The AI microservice is offline. Start it on port 8000 to use the executive chatbot.',
    });
  }
});

// POST /api/ai/predict-risk/:productId
router.post('/predict-risk/:productId', async (req, res, next) => {
  try {
    const data = await proxyToAI('/predict-risk', req.body, 'POST');
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/ai/discount
router.post('/discount', async (req, res, next) => {
  try {
    const data = await proxyToAI('/discount', req.body, 'POST');
    await db.query(
      `INSERT INTO oltp.audit_log (action_type, entity, entity_id, reason, model_used, outcome, trust_level) VALUES($1, $2, $3, $4, $5, $6, $7)`,
      ['discount_applied', 'product', req.body.product_id, data.reason, 'epsilon_greedy_bandit_v1', 'pending', req.body.trust_level || 2]
    );
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/ai/reorder
router.post('/reorder', async (req, res, next) => {
  try {
    const data = await proxyToAI('/reorder', req.body, 'POST');
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/ai/mine-rules
router.get('/mine-rules', async (req, res, next) => {
  try {
    const data = await proxyToAI('/mine-rules');
    res.json(data);
  } catch (err) {
    res.status(503).json({
      error: 'The AI microservice is offline. Start it on port 8000 to mine spoilage association rules.',
    });
  }
});

// POST /api/ai/mine-rules
router.post('/mine-rules', async (req, res, next) => {
  try {
    const data = await proxyToAI('/mine-rules', req.body, 'POST');
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/ai/heatmap
router.get('/heatmap', async (req, res, next) => {
  try {
    const data = await proxyToAI('/heatmap');
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/ai/explain-risk
router.post('/explain-risk', async (req, res, next) => {
  try {
    const data = await proxyToAI('/explain-risk', req.body, 'POST');
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
