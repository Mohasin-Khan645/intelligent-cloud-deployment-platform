const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, deploymentController.getAllDeployments);
router.post('/', authenticateToken, deploymentController.createDeployment);
router.get('/:id', authenticateToken, deploymentController.getDeploymentById);
router.get('/:id/logs', authenticateToken, deploymentController.getDeploymentLogs);

module.exports = router;

