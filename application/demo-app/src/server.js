const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = '1.0.0';

app.use(express.json());

// 1. Root route
app.get('/', (req, res) => {
  res.status(200).json({
    application: 'Demo Application',
    message: 'Application deployed successfully',
    version: VERSION
  });
});

// 2. Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy'
  });
});

// 3. API Version route
app.get('/api/version', (req, res) => {
  res.status(200).json({
    version: VERSION
  });
});

// Only listen when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Demo Application service listening on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/health`);
  });
}

module.exports = app;

