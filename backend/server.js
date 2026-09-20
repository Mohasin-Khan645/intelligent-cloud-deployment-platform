const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const authenticateToken = require('./middleware/auth');
const deploymentController = require('./controllers/deploymentController');

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const deploymentRoutes = require('./routes/deploymentRoutes');
const environmentRoutes = require('./routes/environmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'deployment-platform-api'
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/environments', environmentRoutes);
app.get('/api/monitoring', authenticateToken, deploymentController.getMonitoringMetrics);

// 404 & Global Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server only when not required by test suite
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Intelligent Cloud Deployment Platform Backend running on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;

