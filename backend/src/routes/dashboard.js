const express = require('express');
const router = express.Router();
const db = require('../db');

// GET dashboard KPIs — all figures derived from live PostgreSQL rows.
router.get('/kpis', async (req, res, next) => {
  try {
    const [stockRes, wasteRes, notifRes] = await Promise.all([
      db.query(`
        SELECT
          COALESCE(SUM(st.quantity_on_hand), 0) AS total_units,
          COUNT(*) FILTER (WHERE st.expiry_date IS NOT NULL AND st.expiry_date <= CURRENT_DATE + INTERVAL '2 days') AS critical_count,
          COUNT(*) FILTER (WHERE st.expiry_date IS NOT NULL AND st.expiry_date > CURRENT_DATE + INTERVAL '2 days'
                            AND st.expiry_date <= CURRENT_DATE + INTERVAL '5 days') AS high_count,
          COUNT(*) FILTER (WHERE st.expiry_date IS NOT NULL AND st.expiry_date > CURRENT_DATE + INTERVAL '5 days'
                            AND st.expiry_date <= CURRENT_DATE + INTERVAL '10 days') AS warning_count,
          COALESCE(SUM(p.unit_price * st.quantity_on_hand * 0.25)
            FILTER (WHERE st.expiry_date IS NOT NULL AND st.expiry_date <= CURRENT_DATE + INTERVAL '5 days'), 0) AS potential_savings
        FROM oltp.stock st
        JOIN oltp.products p ON p.id = st.product_id
      `),
      db.query(`
        SELECT
          to_char(t.date_id, 'Mon DD') AS date,
          COALESCE(SUM(f.quantity_wasted), 0) AS total_wasted,
          COALESCE(SUM(f.loss_value), 0)     AS total_loss
        FROM warehouse.fact_waste_events f
        JOIN warehouse.dim_time t ON t.date_id = f.date_id
        GROUP BY t.date_id
        ORDER BY t.date_id DESC
        LIMIT 7
      `),
      db.query(`SELECT COUNT(*) FILTER (WHERE NOT is_read) AS unread FROM oltp.notifications`),
    ]);

    const s = stockRes.rows[0] || {};
    const criticalCount = Number(s.critical_count || 0);
    const highCount = Number(s.high_count || 0);
    const warningCount = Number(s.warning_count || 0);

    // Waste reduction: compare the most recent 7 days against the preceding 7 days of loss_value.
    const trend = wasteRes.rows.slice().reverse();
    const recentLoss = trend.slice(-5).reduce((a, r) => a + Number(r.total_loss || 0), 0);
    const priorLoss = trend.slice(0, 5).reduce((a, r) => a + Number(r.total_loss || 0), 0);
    let wasteReductionPct = 0;
    if (priorLoss > 0) wasteReductionPct = Math.round(((priorLoss - recentLoss) / priorLoss) * 100);

    res.json({
      kpis: {
        totalItems: Number(s.total_units || 0),
        criticalCount,
        highCount,
        warningCount,
        potentialSavings: (Number(s.potential_savings || 0) / 1000).toFixed(1) + 'k',
        unreadNotifications: Number(notifRes.rows[0]?.unread || 0),
        wasteReductionPct: `${wasteReductionPct >= 0 ? '+' : ''}${wasteReductionPct}%`,
      },
      wasteTrend: trend,
    });
  } catch (err) { next(err); }
});

// POST /api/dashboard/refresh — recompute dataset analytics for every store + the global rollup.
router.post('/refresh', async (req, res, next) => {
  try {
    const { recomputeAll } = require('../lib/datasetAnalytics');
    await recomputeAll();
    const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM dataset.stores');
    res.json({ success: true, stores: rows[0]?.n ?? 0, message: 'Dataset analytics recomputed from live data' });
  } catch (err) { next(err); }
});

// GET recent activity
router.get('/activity', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT * FROM oltp.audit_log ORDER BY created_at DESC LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
