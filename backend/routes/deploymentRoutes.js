const express = require('express');

const router = express.Router();

const deploymentController =
  require('../controllers/deploymentController');

const authenticateToken =
  require('../middleware/auth');

router.get(
  '/live-status',
  authenticateToken,
  deploymentController.getRealDeploymentStatus
);

router.get(
  '/',
  authenticateToken,
  deploymentController.getAllDeployments
);

router.post(
  '/',
  authenticateToken,
  deploymentController.createDeployment
);

router.get(
  '/:id',
  authenticateToken,
  deploymentController.getDeploymentById
);

router.get(
  '/:id/logs',
  authenticateToken,
  deploymentController.getDeploymentLogs
);

router.get(
  '/:id/github-logs',
  authenticateToken,
  deploymentController.getGitHubDeploymentLogs
);

/*
 * Synchronize PostgreSQL deployment status
 * with its GitHub Actions run.
 */
router.post(
  '/:id/sync',
  authenticateToken,
  deploymentController.syncDeploymentStatus
);


router.post(
  '/:id/rollback',
  authenticateToken,
  deploymentController.rollbackDeployment
);



module.exports = router;