const express = require('express');

const router = express.Router();

const authenticateToken =
  require('../middleware/auth');

const githubActionsController =
  require('../controllers/githubActionsController');

router.get(
  '/runs',
  authenticateToken,
  githubActionsController.getWorkflowRuns
);

router.get(
  '/latest',
  authenticateToken,
  githubActionsController.getLatestDeploymentStatus
);

router.get(
  '/runs/:runId',
  authenticateToken,
  githubActionsController.getWorkflowRun
);

router.get(
  '/runs/:runId/jobs',
  authenticateToken,
  githubActionsController.getWorkflowRunJobs
);

/*
 * Trigger real GitHub Actions deployment.
 */
router.post(
  '/trigger',
  authenticateToken,
  githubActionsController.triggerDeployment
);

module.exports = router;