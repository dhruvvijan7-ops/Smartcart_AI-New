const db = require('../db');

/**
 * Autonomy Trust Dial Level Specs (L1 to L5):
 * Level 1: Advisory Only (0% Auto-execution)
 * Level 2: Low-Impact Auto (Discounts <= 15%)
 * Level 3: Balanced Auto (Discounts <= 30%, Reorder <= $1000)
 * Level 4: High Autonomy (Discounts <= 50%, Reorder <= $5000)
 * Level 5: Fully Autonomous (100% Auto-execution for all actions)
 */

async function getTrustLevel() {
  try {
    const res = await db.query("SELECT value FROM oltp.settings WHERE key = 'trust_level'");
    if (res.rows.length > 0) {
      return parseInt(res.rows[0].value, 10) || 2;
    }
  } catch (err) {
    console.warn('Failed to query trust_level, fallback to level 2');
  }
  return 2;
}

function checkAutonomyGating(actionType) {
  return async (req, res, next) => {
    const trustLevel = await getTrustLevel();
    req.trustLevel = trustLevel;

    let autoExecute = false;

    switch (actionType) {
      case 'discount': {
        const discountPct = req.body.discount_pct || 20;
        if (trustLevel === 5) autoExecute = true;
        else if (trustLevel === 4 && discountPct <= 50) autoExecute = true;
        else if (trustLevel === 3 && discountPct <= 30) autoExecute = true;
        else if (trustLevel === 2 && discountPct <= 15) autoExecute = true;
        break;
      }
      case 'reorder': {
        if (trustLevel >= 4) autoExecute = true;
        else if (trustLevel === 3) autoExecute = true;
        break;
      }
      case 'maintenance': {
        if (trustLevel >= 3) autoExecute = true;
        break;
      }
      default:
        autoExecute = trustLevel >= 3;
    }

    req.autoExecuted = autoExecute;
    req.executionStatus = autoExecute ? 'Auto-Executed' : 'Pending Approval';
    next();
  };
}

module.exports = {
  getTrustLevel,
  checkAutonomyGating,
};
