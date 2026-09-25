const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth');
const awsController = require('../controllers/awsController');

router.get('/ecs/status', authenticateToken, awsController.getECSStatus);
router.get('/alb/status', authenticateToken, awsController.getALBStatus);
router.get(
  '/cloudwatch/metrics',
  authenticateToken,
  awsController.getCloudWatchMetrics
);

router.get(
  '/logs',
  authenticateToken,
  awsController.getCloudWatchLogs
);

module.exports = router;