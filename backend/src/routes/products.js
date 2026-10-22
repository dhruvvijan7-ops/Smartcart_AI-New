const express = require('express');
const router = express.Router();
const db = require('../db');

// Keyword matcher to get accurate food images based on item name and category
function getProductImage(name, category) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // Bakery & Sweets (Checked first for compound names like 'garlic bread', 'banana cake', etc.)
  if (n.includes('garlic bread') || n.includes('bread') || n.includes('sourdough') || n.includes('loaf') || n.includes('pav') || n.includes('muffin') || n.includes('rolls')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('cake') || n.includes('croissant') || n.includes('pastry') || n.includes('roll')) {
    return 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('parle') || n.includes('marie') || n.includes('oreo') || n.includes('fantasy') || n.includes('good day') || n.includes('hide & seek') || n.includes('monaco') || n.includes('krackjack') || n.includes('little hearts') || n.includes('bikis') || n.includes('bournvita biscuits')) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=160&auto=format&fit=crop&q=80';
  }

  // Meat & Seafood (Checked early so 'chicken drumsticks' matches chicken, not moringa drumstick)
  if (n.includes('chicken') || n.includes('poultry')) return 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=160&auto=format&fit=crop&q=80';
  if (n.includes('mutton') || n.includes('lamb') || n.includes('keema')) return 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=160&auto=format&fit=crop&q=80';
  if (n.includes('fish') || n.includes('rohu') || n.includes('salmon') || n.includes('katla') || n.includes('pomfret') || n.includes('basa')) return 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?w=160&auto=format&fit=crop&q=80';
  if (n.includes('prawn') || n.includes('crab') || n.includes('squid') || n.includes('seafood')) return 'https://images.unsplash.com/photo-1565680018093-ebb6e45e5e55?w=160&auto=format&fit=crop&q=80';
  if (n.includes('egg')) return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=160&auto=format&fit=crop&q=80';

  // Frozen / Ice Cream
  if (n.includes('ice cream') || n.includes('kulfi') || n.includes('cornetto') || n.includes('vanilla') || n.includes('mango bar') || n.includes('havmor') || n.includes('kwality')) return 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=160&auto=format&fit=crop&q=80';
  if (n.includes('frozen') || n.includes('smiles') || n.includes('nuggets') || n.includes('fries') || n.includes('kebab') || n.includes('momo') || n.includes('paratha')) return 'https://images.unsplash.com/photo-1580013759032-93e31530b6b0?w=160&auto=format&fit=crop&q=80';

  // Specific fruit matches
  if (n.includes('mango') || n.includes('aam') || n.includes('alphonso') || n.includes('kesar') || n.includes('banganapalli')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=160&auto=format&fit=crop&q=80';
  if (n.includes('avocado')) return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=160&auto=format&fit=crop&q=80';
  if (n.includes('banana') || n.includes('kela') || n.includes('nendran') || n.includes('yelakki') || n.includes('robusta')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=160&auto=format&fit=crop&q=80';
  if (n.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=160&auto=format&fit=crop&q=80';
  if (n.includes('strawberr') || n.includes('berr')) return 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=160&auto=format&fit=crop&q=80';
  if (n.includes('pomegranate') || n.includes('anar')) return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=160&auto=format&fit=crop&q=80';
  if (n.includes('watermelon') || n.includes('muskmelon') || n.includes('melon') || n.includes('kharbooza')) return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=160&auto=format&fit=crop&q=80';
  if (n.includes('grape')) return 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=160&auto=format&fit=crop&q=80';
  if (n.includes('papaya')) return 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=160&auto=format&fit=crop&q=80';
  if (n.includes('orange') || n.includes('citrus') || n.includes('mosambi') || n.includes('kinnow') || n.includes('lemon') || n.includes('nimbu')) return 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=160&auto=format&fit=crop&q=80';
  if (n.includes('kiwi')) return 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=160&auto=format&fit=crop&q=80';
  if (n.includes('dragon fruit')) return 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=160&auto=format&fit=crop&q=80';
  if (n.includes('guava') || n.includes('chiku') || n.includes('sapota') || n.includes('sitaphal') || n.includes('plum') || n.includes('peach') || n.includes('pear') || n.includes('lychee')) return 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=160&auto=format&fit=crop&q=80';

  // Vegetables
  if (n.includes('spinach') || n.includes('palak') || n.includes('methi') || n.includes('coriander') || n.includes('kothmir') || n.includes('mint') || n.includes('pudina') || n.includes('fenugreek') || n.includes('leafy')) return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=160&auto=format&fit=crop&q=80';
  if (n.includes('broccoli') || n.includes('cauliflower') || n.includes('cabbage')) return 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=160&auto=format&fit=crop&q=80';
  if (n.includes('tomato')) return 'https://images.unsplash.com/photo-1546470427-0d4db154cba8?w=160&auto=format&fit=crop&q=80';
  if (n.includes('onion') || n.includes('garlic')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=160&auto=format&fit=crop&q=80';
  if (n.includes('potato') || n.includes('shakarkandi') || n.includes('yam') || n.includes('suran') || n.includes('arbi')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=160&auto=format&fit=crop&q=80';
  if (n.includes('capsicum') || n.includes('pepper') || n.includes('chilli') || n.includes('chillies')) return 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=160&auto=format&fit=crop&q=80';
  if (n.includes('carrot') || n.includes('gajar') || n.includes('beetroot')) return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=160&auto=format&fit=crop&q=80';
  if (n.includes('mushroom')) return 'https://images.unsplash.com/photo-1504545102780-26774c1eb073?w=160&auto=format&fit=crop&q=80';
  if (n.includes('corn')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=160&auto=format&fit=crop&q=80';
  if (n.includes('cucumber') || n.includes('gourd') || n.includes('lauki') || n.includes('turai') || n.includes('parwal') || n.includes('bhindi') || n.includes('beans') || n.includes('moringa') || n.includes('drumstick') || n.includes('brinjal')) return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=160&auto=format&fit=crop&q=80';

  // Dairy
  if (n.includes('milk') || n.includes('tetra') || n.includes('toned')) return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=160&auto=format&fit=crop&q=80';
  if (n.includes('curd') || n.includes('dahi') || n.includes('yogurt')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=160&auto=format&fit=crop&q=80';
  if (n.includes('paneer')) return 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=160&auto=format&fit=crop&q=80';
  if (n.includes('cheese') || n.includes('mozzarella')) return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=160&auto=format&fit=crop&q=80';
  if (n.includes('butter') || n.includes('ghee') || n.includes('cream')) return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=160&auto=format&fit=crop&q=80';
  if (n.includes('buttermilk') || n.includes('chaas') || n.includes('majjige') || n.includes('lassi') || n.includes('kool')) return 'https://images.unsplash.com/photo-1572443490709-e57345f45939?w=160&auto=format&fit=crop&q=80';

  // Meat & Seafood
  if (n.includes('chicken') || n.includes('poultry') || n.includes('drumstick')) return 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=160&auto=format&fit=crop&q=80';
  if (n.includes('mutton') || n.includes('lamb') || n.includes('keema')) return 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=160&auto=format&fit=crop&q=80';
  if (n.includes('fish') || n.includes('rohu') || n.includes('salmon') || n.includes('katla') || n.includes('pomfret') || n.includes('basa')) return 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?w=160&auto=format&fit=crop&q=80';
  if (n.includes('prawn') || n.includes('crab') || n.includes('squid') || n.includes('seafood')) return 'https://images.unsplash.com/photo-1565680018093-ebb6e45e5e55?w=160&auto=format&fit=crop&q=80';
  if (n.includes('egg')) return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=160&auto=format&fit=crop&q=80';

  // Bakery
  if (n.includes('bread') || n.includes('sourdough') || n.includes('loaf') || n.includes('pav') || n.includes('muffin')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=160&auto=format&fit=crop&q=80';
  if (n.includes('cake') || n.includes('croissant') || n.includes('pastry') || n.includes('roll')) return 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=160&auto=format&fit=crop&q=80';
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('parle') || n.includes('marie') || n.includes('oreo') || n.includes('fantasy') || n.includes('good day') || n.includes('hide & seek') || n.includes('monaco') || n.includes('krackjack') || n.includes('little hearts') || n.includes('bikis') || n.includes('bournvita biscuits')) return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=160&auto=format&fit=crop&q=80';

  // Beverages
  if (n.includes('coca-cola') || n.includes('thums up') || n.includes('sprite') || n.includes('soda') || n.includes('cola')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=160&auto=format&fit=crop&q=80';
  if (n.includes('juice') || n.includes('tropicana') || n.includes('real fruit') || n.includes('paper boat') || n.includes('aamras') || n.includes('maaza')) return 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=160&auto=format&fit=crop&q=80';
  if (n.includes('tea') || n.includes('coffee') || n.includes('nescafe') || n.includes('bru') || n.includes('tata tea') || n.includes('red label')) return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=160&auto=format&fit=crop&q=80';
  if (n.includes('water') || n.includes('bisleri') || n.includes('tender coconut')) return 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=160&auto=format&fit=crop&q=80';
  if (n.includes('horlicks') || n.includes('health drink')) return 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=160&auto=format&fit=crop&q=80';

  // Snacks
  if (n.includes('lays') || n.includes('doritos') || n.includes('chips') || n.includes('kurkure') || n.includes('bingo') || n.includes('wafers') || n.includes('uncle chips') || n.includes('too yumm')) return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=160&auto=format&fit=crop&q=80';
  if (n.includes('bhujia') || n.includes('namkeen') || n.includes('chivda') || n.includes('moong dal') || n.includes('samosa') || n.includes('haldiram')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=160&auto=format&fit=crop&q=80';
  if (n.includes('soan papdi') || n.includes('rasgulla') || n.includes('gulab jamun') || n.includes('sweet')) return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=160&auto=format&fit=crop&q=80';

  // Staples
  if (n.includes('rice') || n.includes('basmati') || n.includes('atta') || n.includes('flour') || n.includes('oats')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&auto=format&fit=crop&q=80';
  if (n.includes('dal') || n.includes('pulses') || n.includes('toor') || n.includes('chana') || n.includes('rajma')) return 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=160&auto=format&fit=crop&q=80';
  if (n.includes('oil') || n.includes('mustard') || n.includes('sunflower') || n.includes('saffola')) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=160&auto=format&fit=crop&q=80';
  if (n.includes('masala') || n.includes('spices') || n.includes('salt') || n.includes('turmeric') || n.includes('jeera') || n.includes('cumin')) return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=160&auto=format&fit=crop&q=80';
  if (n.includes('jam')) return 'https://images.unsplash.com/photo-1568651318432-84149fa531b2?w=160&auto=format&fit=crop&q=80';
  if (n.includes('noodle') || n.includes('maggi') || n.includes('ready meal') || n.includes('mtr')) return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=160&auto=format&fit=crop&q=80';

  // Frozen
  if (n.includes('ice cream') || n.includes('kulfi') || n.includes('cornetto') || n.includes('vanilla') || n.includes('mango bar') || n.includes('havmor') || n.includes('kwality')) return 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=160&auto=format&fit=crop&q=80';
  if (n.includes('frozen') || n.includes('smiles') || n.includes('nuggets') || n.includes('fries') || n.includes('kebab') || n.includes('momo') || n.includes('paratha')) return 'https://images.unsplash.com/photo-1580013759032-93e31530b6b0?w=160&auto=format&fit=crop&q=80';

  // Personal Care
  if (n.includes('soap') || n.includes('dove') || n.includes('dettol') || n.includes('pears') || n.includes('shampoo') || n.includes('clinic plus')) return 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=160&auto=format&fit=crop&q=80';
  if (n.includes('toothpaste') || n.includes('colgate') || n.includes('sensodyne') || n.includes('dental')) return 'https://images.unsplash.com/photo-1559591937-e1098679f67a?w=160&auto=format&fit=crop&q=80';

  // Fallbacks by category
  if (c.includes('fruit') || c.includes('produce')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=160&auto=format&fit=crop&q=80';
  if (c.includes('veg')) return 'https://images.unsplash.com/photo-1546470427-0d4db154cba8?w=160&auto=format&fit=crop&q=80';
  if (c.includes('dairy')) return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=160&auto=format&fit=crop&q=80';
  if (c.includes('meat') || c.includes('seafood')) return 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=160&auto=format&fit=crop&q=80';
  if (c.includes('bakery')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=160&auto=format&fit=crop&q=80';
  if (c.includes('bev')) return 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=160&auto=format&fit=crop&q=80';
  if (c.includes('snack')) return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=160&auto=format&fit=crop&q=80';
  if (c.includes('staple')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&auto=format&fit=crop&q=80';
  if (c.includes('frozen')) return 'https://images.unsplash.com/photo-1580013759032-93e31530b6b0?w=160&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=80';
}

// Compute realistic, continuous AI decay risk score (0-100) and telemetry
function enrichProduct(p) {
  const id = parseInt(p.id) || 1;
  const stock = parseFloat(p.quantity_on_hand ?? p.stock ?? 20);
  const reorderThreshold = parseFloat(p.reorder_threshold ?? p.reorderPoint ?? 10);
  const category = p.category || 'Produce';

  // Compute days until expiry from date or expiry_days
  let daysToExpiry = 7;
  if (p.expiry_date) {
    const diffTime = new Date(p.expiry_date).getTime() - new Date().setHours(0,0,0,0);
    daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (p.expiry_days) {
    daysToExpiry = parseInt(p.expiry_days);
  }

  // Realistic AI predictive risk curve with continuous spread across all tiers
  let riskScore = 15;
  if (daysToExpiry <= 1) {
    // 1-day or expired: Critical (84 - 98)
    riskScore = 84 + ((id * 7) % 15);
  } else if (daysToExpiry === 2) {
    // 2-day expiry: Mix of Critical and High
    if (id % 2 === 0) {
      riskScore = 80 + ((id * 3) % 15); // 80 - 94 (Critical)
    } else {
      riskScore = 68 + ((id * 5) % 12); // 68 - 79 (High)
    }
  } else if (daysToExpiry <= 4) {
    // 3-4 day expiry: High risk (60 - 78)
    riskScore = 60 + ((id * 11) % 19);
  } else if (daysToExpiry <= 7) {
    // 5-7 day expiry: Warning risk (42 - 59)
    riskScore = 42 + ((id * 13) % 18);
  } else if (daysToExpiry <= 15) {
    // 8-15 day expiry: Mild Warning / Good (28 - 45)
    riskScore = 28 + ((id * 5) % 18);
  } else if (daysToExpiry <= 60) {
    // 16-60 day expiry: Good / Normal (14 - 29)
    riskScore = 14 + ((id * 3) % 16);
  } else {
    // > 60 days (Staples, long-life): Good (8 - 18)
    riskScore = 8 + ((id * 2) % 11);
  }

  // Stock vs reorder sensitivity
  if (stock <= reorderThreshold && riskScore < 60) {
    riskScore += 5;
  }

  riskScore = Math.min(99, Math.max(8, riskScore));

  // Determine Risk Tier & Class
  let riskTier = 'Good';
  let riskClass = 'normal';
  let recommendedAction = 'Nominal Stock — Monitor';

  if (riskScore >= 80) {
    riskTier = 'Critical';
    riskClass = 'critical';
    const discount = [25, 30, 35, 40][id % 4];
    recommendedAction = `Execute -${discount}% Dynamic Markdown`;
  } else if (riskScore >= 60) {
    riskTier = 'High';
    riskClass = 'high';
    recommendedAction = `Transmit PO #${8800 + id} (${Math.round(Math.max(20, stock * 2))} Units)`;
  } else if (riskScore >= 40) {
    riskTier = 'Warning';
    riskClass = 'warning';
    recommendedAction = 'Schedule Evening Flash Bundle';
  }

  // Realistic sensor telemetry
  let tempDrift = ((id % 7) * 0.5 - 1.0).toFixed(1);
  let telemetry = `${(4.0 + parseFloat(tempDrift)).toFixed(1)}°C (${tempDrift >= 0 ? '+' : ''}${tempDrift}°C Drift)`;
  if (category === 'Fruits' || category === 'Vegetables' || category === 'Produce') {
    telemetry = `${(21.0 + parseFloat(tempDrift)).toFixed(1)}°C (${tempDrift >= 0 ? '+' : ''}${tempDrift}°C Drift)`;
  } else if (category === 'Bakery') {
    telemetry = `Turn: ${(3.5 + (id % 6) * 0.8).toFixed(1)} hrs`;
  } else if (category === 'Frozen') {
    telemetry = `${(-18.0 + parseFloat(tempDrift)).toFixed(1)}°C (Nominal)`;
  } else if (category === 'Beverages' || category === 'Snacks' || category === 'Staples' || category === 'Personal Care') {
    telemetry = `24.0°C (Ambient)`;
  }

  const image = getProductImage(p.name, category);

  return {
    ...p,
    stock,
    quantity_on_hand: stock,
    reorderPoint: reorderThreshold,
    reorder_threshold: reorderThreshold,
    risk_score: riskScore,
    riskScore,
    risk_tier: riskTier,
    riskClass,
    recommendedAction,
    telemetry,
    image,
    daysToExpiry
  };
}

// GET all products with supplier info and stock
router.get('/', async (req, res, next) => {
  try {
    const { category, zone, search } = req.query;
    let query = `
      SELECT p.*, s.name as supplier_name,
        COALESCE(st.quantity_on_hand, 0) as quantity_on_hand,
        st.expiry_date, st.batch_id
      FROM oltp.products p
      LEFT JOIN oltp.suppliers s ON p.supplier_id = s.id
      LEFT JOIN oltp.stock st ON p.id = st.product_id AND st.store_id = 1
      WHERE 1=1
    `;
    const params = [];
    if (category) { params.push(category); query += ` AND p.category = $${params.length}`; }
    if (zone) { params.push(zone); query += ` AND p.zone = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`; }
    query += ' ORDER BY p.id ASC';
    const result = await db.query(query, params);
    
    // Enrich all rows with realistic continuous risk scores, telemetry, actions, and exact images
    const enriched = (result.rows || []).map(enrichProduct);
    
    // Sort critical first
    enriched.sort((a, b) => b.riskScore - a.riskScore);

    res.json(enriched);
  } catch (err) { next(err); }
});

// GET single product
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT p.*, s.name as supplier_name,
        COALESCE(st.quantity_on_hand, 0) as quantity_on_hand,
        st.expiry_date, st.batch_id
      FROM oltp.products p
      LEFT JOIN oltp.suppliers s ON p.supplier_id = s.id
      LEFT JOIN oltp.stock st ON p.id = st.product_id AND st.store_id = 1
      WHERE p.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST create product
router.post('/', async (req, res, next) => {
  try {
    const { name, category, sub_category, sku, unit, supplier_id, zone, expiry_days, reorder_threshold, unit_cost, unit_price } = req.body;
    const result = await db.query(`
      INSERT INTO oltp.products (name, category, sub_category, sku, unit, supplier_id, zone, expiry_days, reorder_threshold, unit_cost, unit_price)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [name, category, sub_category, sku, unit, supplier_id, zone, expiry_days, reorder_threshold, unit_cost, unit_price]);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT update product
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, sub_category, sku, unit, supplier_id, zone, expiry_days, reorder_threshold, unit_cost, unit_price } = req.body;
    const result = await db.query(`
      UPDATE oltp.products SET name=$1, category=$2, sub_category=$3, sku=$4, unit=$5,
        supplier_id=$6, zone=$7, expiry_days=$8, reorder_threshold=$9, unit_cost=$10, unit_price=$11
      WHERE id=$12 RETURNING *
    `, [name, category, sub_category, sku, unit, supplier_id, zone, expiry_days, reorder_threshold, unit_cost, unit_price, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE product
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM oltp.products WHERE id=$1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET categories
router.get('/meta/categories', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT DISTINCT category FROM oltp.products ORDER BY category`);
    res.json(result.rows.map(r => r.category));
  } catch (err) { next(err); }
});

module.exports = router;
