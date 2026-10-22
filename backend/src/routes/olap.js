const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/olap/cube — Parameterized Rollup Query
router.get('/cube', async (req, res, next) => {
  try {
    const { groupBy = 'category' } = req.query; // category | zone | month
    
    let groupColumn = 'dc.name';
    let selectName = 'dc.name as group_key';
    
    if (groupBy === 'zone') {
      groupColumn = 'ds.zone';
      selectName = 'ds.zone as group_key';
    } else if (groupBy === 'month') {
      groupColumn = 'dt.month_name';
      selectName = 'dt.month_name as group_key';
    }

    const query = `
      SELECT 
        ${selectName},
        SUM(fwe.quantity_wasted) as total_wasted_qty,
        SUM(fwe.loss_value) as total_loss_value,
        AVG(fwe.risk_score) as avg_risk_score,
        COUNT(fwe.id) as waste_event_count
      FROM warehouse.fact_waste_events fwe
      JOIN warehouse.dim_product dp ON fwe.product_sk = dp.product_sk
      JOIN warehouse.dim_category dc ON fwe.category_sk = dc.category_sk
      JOIN warehouse.dim_store ds ON fwe.store_sk = ds.store_sk
      JOIN warehouse.dim_time dt ON fwe.date_id = dt.date_id
      GROUP BY ${groupColumn}
      ORDER BY total_loss_value DESC
    `;

    const result = await db.query(query);
    res.json({
      dimension: groupBy,
      data: result.rows
    });
  } catch (err) { next(err); }
});

module.exports = router;
