require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/products',     require('./routes/products'));
app.use('/api/suppliers',    require('./routes/suppliers'));
app.use('/api/customers',    require('./routes/customers'));
app.use('/api/stores',       require('./routes/stores'));
app.use('/api/dataset',      require('./routes/dataset'));
app.use('/api/compare',      require('./routes/compare'));
app.use('/api/stock',        require('./routes/stock'));
app.use('/api/purchases',    require('./routes/purchases'));
app.use('/api/sales',        require('./routes/sales'));
app.use('/api/receipts',     require('./routes/receipts'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/audit',        require('./routes/audit'));
app.use('/api/discounts',    require('./routes/discounts'));
app.use('/api/reorders',     require('./routes/reorders'));
app.use('/api/olap',         require('./routes/olap'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/ai',           require('./routes/ai'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SmartCart API running on http://localhost:${PORT}`);
});

module.exports = app;
