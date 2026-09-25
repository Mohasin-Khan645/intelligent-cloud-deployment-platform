const rollbackService =
  require('../services/aws/rollbackService');
const deploymentStatusService =
  require('../services/aws/deploymentStatusService');

const deploymentSyncService =
  require('../services/deploymentSyncService');

const githubActionsService =
  require('../services/githubActionsService');

const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const Environment = require('../models/Environment');
const logger = require('../utils/logger');


/*
 * Get all deployments
 */
exports.getAllDeployments = async (req, res, next) => {
  try {
    const { projectId, environment } = req.query;

    const deployments = await Deployment.findAll({
      projectId,
      environment
    });

    res.status(200).json({
      data: deployments
    });
  } catch (error) {
    next(error);
  }
};


/*
 * Get deployment by ID
 *
 * Returns:
 * - Deployment information
 * - Duration
 * - GitHub Actions run information
 */
exports.getDeploymentById = async (req, res, next) => {
  try {
    const deploymentId =
      parseInt(req.params.id, 10);

    if (Number.isNaN(deploymentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deployment ID.'
      });
    }

    const deployment =
      await Deployment.findById(deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found.'
      });
    }

    let durationSeconds = null;
    let duration = null;

    if (deployment.started_at) {
      const startTime =
        new Date(deployment.started_at);

      const endTime =
        deployment.completed_at
          ? new Date(deployment.completed_at)
          : new Date();

      durationSeconds =
        Math.max(
          0,
          Math.floor(
            (
              endTime.getTime() -
              startTime.getTime()
            ) / 1000
          )
        );

      const minutes =
        Math.floor(durationSeconds / 60);

      const seconds =
        durationSeconds % 60;

      duration =
        minutes > 0
          ? `${minutes}m ${seconds}s`
          : `${seconds}s`;
    }

    res.status(200).json({
      success: true,

      data: {
        deployment: {
          id: deployment.id,

          project_id:
            deployment.project_id,

          project_name:
            deployment.project_name || null,

          version:
            deployment.version,

          commit_sha:
            deployment.commit_sha,

          environment:
            deployment.environment,

          status:
            deployment.status,

          started_at:
            deployment.started_at,

          completed_at:
            deployment.completed_at,

          durationSeconds,

          duration,

          error_message:
            deployment.error_message || null,

          github: {
            runId:
              deployment.github_run_id || null,

            runNumber:
              deployment.github_run_number || null,

            url:
              deployment.github_run_url || null
          }
        }
      }
    });

  } catch (error) {
    next(error);
  }
};


/*
 * Create deployment record
 *
 * Real deployment status comes from:
 *
 * GitHub Actions
 *       ↓
 * ECS
 *       ↓
 * ALB
 */
exports.createDeployment = async (req, res, next) => {
  try {
    const {
      project_id,
      version,
      commit_sha,
      environment,
      status,
      error_message
    } = req.body;

    if (!project_id) {
      return res.status(400).json({
        error:
          'project_id is required to trigger a deployment.'
      });
    }

    const project =
      await Project.findById(project_id);

    if (!project) {
      return res.status(404).json({
        error:
          'Referenced project does not exist.'
      });
    }

    /*
     * New deployment records start as QUEUED.
     */
    const deploymentStatus =
      status || 'QUEUED';

    const deployment =
      await Deployment.create({
        project_id,

        version:
          version ||
          `v1.0.${Math.floor(
            Math.random() * 90 + 10
          )}`,

        commit_sha:
          commit_sha || 'pending',

        environment:
          environment || 'Production',

        status:
          deploymentStatus,

        error_message:
          error_message || null
      });

    logger.info(
      `Deployment record created: #${deployment.id}`
    );

    res.status(201).json({
      message:
        'Deployment record created successfully.',

      data: deployment
    });

  } catch (error) {
    next(error);
  }
};


/*
 * Get deployment logs
 *
 * Legacy/local logs endpoint.
 */
exports.getDeploymentLogs = async (
  req,
  res,
  next
) => {
  try {
    const deployment =
      await Deployment.findById(
        req.params.id
      );

    if (!deployment) {
      return res.status(404).json({
        error: 'Deployment not found.'
      });
    }

    const logs =
      Deployment.getLogs(deployment);

    res.status(200).json({
      data: logs
    });

  } catch (error) {
    next(error);
  }
};


/*
 * Get REAL GitHub Actions deployment logs
 *
 * PostgreSQL deployment
 *        ↓
 * GitHub Run ID
 *        ↓
 * GitHub Actions Jobs
 *        ↓
 * GitHub Actions Steps
 */
exports.getGitHubDeploymentLogs = async (
  req,
  res,
  next
) => {
  try {
    const deploymentId =
      parseInt(req.params.id, 10);

    if (Number.isNaN(deploymentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deployment ID.'
      });
    }

    const deployment =
      await Deployment.findById(
        deploymentId
      );

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found.'
      });
    }

    /*
     * Old/demo deployments do not have
     * a GitHub Actions run.
     */
    if (!deployment.github_run_id) {
      return res.status(409).json({
        success: false,
        error:
          'This deployment is not linked to a GitHub Actions run.'
      });
    }

    const github =
      await githubActionsService
        .getWorkflowRunJobs(
          deployment.github_run_id
        );

    res.status(200).json({
      success: true,

      data: {
        deployment: {
          id:
            deployment.id,

          project_id:
            deployment.project_id,

          project_name:
            deployment.project_name || null,

          version:
            deployment.version,

          commit_sha:
            deployment.commit_sha,

          environment:
            deployment.environment,

          status:
            deployment.status,

          started_at:
            deployment.started_at,

          completed_at:
            deployment.completed_at
        },

        github: {
          runId:
            deployment.github_run_id,

          runNumber:
            deployment.github_run_number,

          url:
            deployment.github_run_url,

          jobs:
            github.jobs || []
        }
      }
    });

  } catch (error) {
    next(error);
  }
};


/*
 * Legacy local monitoring endpoint
 *
 * Real AWS monitoring:
 * /api/aws/cloudwatch/metrics
 */
exports.getMonitoringMetrics = async (
  req,
  res,
  next
) => {
  try {
    const [
      deployments,
      environments
    ] = await Promise.all([
      Deployment.findAll(),
      Environment.findAll()
    ]);

    const activeDeployments =
      deployments.filter(
        deployment =>
          [
            'QUEUED',
            'BUILDING',
            'DEPLOYING',
            'HEALTH_CHECK'
          ].includes(
            deployment.status
          )
      ).length;

    const healthyEnvironments =
      environments.filter(
        environment =>
          environment.status === 'Healthy'
      ).length;

    const metrics = {
      timestamp:
        new Date().toISOString(),

      system: {
        status: 'Healthy',

        uptimeSeconds:
          Math.floor(
            process.uptime()
          ),

        nodeVersion:
          process.version,

        platform:
          process.platform
      },

      resources: {
        cpuUsagePercent:
          (Math.random() * 8 + 12)
            .toFixed(1),

        memoryUsagePercent:
          (Math.random() * 5 + 38)
            .toFixed(1),

        activeConnections:
          Math.floor(
            Math.random() * 12 + 8
          ),

        totalRequestsHandled:
          14829
      },

      infrastructure: {
        activeDeployments,

        healthyEnvironments,

        totalEnvironments:
          environments.length,

        cloudWatchConfigured:
          false,

        note:
          'Legacy local telemetry endpoint. Use /api/aws/cloudwatch/metrics for real AWS CloudWatch metrics.'
      }
    };

    res.status(200).json({
      data: metrics
    });

  } catch (error) {
    next(error);
  }
};


/*
 * REAL DEPLOYMENT STATUS
 *
 * GitHub Actions
 *       ↓
 * ECS
 *       ↓
 * ALB
 */
exports.getRealDeploymentStatus =
  async (req, res, next) => {
    try {
      const data =
        await deploymentStatusService
          .getRealDeploymentStatus();

      res.status(200).json({
        success: true,
        data
      });

    } catch (error) {
      next(error);
    }
  };


/*
 * SYNCHRONIZE DEPLOYMENT STATUS
 *
 * PostgreSQL deployment
 *        ↓
 * GitHub Actions Run
 *        ↓
 * Real status
 *        ↓
 * PostgreSQL
 */
exports.syncDeploymentStatus =
  async (req, res, next) => {
    try {
      const deploymentId =
        parseInt(req.params.id, 10);

      if (Number.isNaN(deploymentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid deployment ID.'
        });
      }

      const result =
        await deploymentSyncService
          .syncDeployment(
            deploymentId
          );

      res.status(200).json({
        success: true,

        message:
          'Deployment status synchronized successfully.',

        data: result
      });

    } catch (error) {
      next(error);
    }
  };


  /*
 * ROLLBACK DEPLOYMENT
 *
 * Current ECS revision
 *        ↓
 * Previous ECS revision
 *        ↓
 * ECS service update
 *        ↓
 * Wait for stability
 *        ↓
 * ALB health verification
 */
exports.rollbackDeployment =
  async (req, res, next) => {
    try {
      const deploymentId =
        parseInt(req.params.id, 10);

      if (Number.isNaN(deploymentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid deployment ID.'
        });
      }

      const deployment =
        await Deployment.findById(
          deploymentId
        );

      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found.'
        });
      }

      /*
       * Only allow rollback of a deployment
       * that completed successfully.
       */
      if (
        deployment.status !== 'SUCCESS'
      ) {
        return res.status(409).json({
          success: false,
          error:
            'Only a successful deployment can be rolled back.'
        });
      }

      logger.info(
        `Rollback requested for deployment #${deployment.id}`
      );

      /*
       * Perform ECS rollback.
       */
      const rollback =
        await rollbackService
          .rollbackToPreviousRevision(
            deployment.id
          );

      /*
       * Mark the selected deployment
       * as rolled back.
       */
      const updatedDeployment =
        await Deployment.updateStatus(
          deployment.id,
          'ROLLED_BACK',
          'Manual rollback initiated successfully.',
          new Date()
        );

      logger.info(
        `Deployment #${deployment.id} rolled back successfully.`
      );

      res.status(200).json({
        success: true,

        message:
          'Deployment rolled back successfully.',

        data: {
          deployment:
            updatedDeployment,

          rollback
        }
      });

    } catch (error) {
      logger.error(
        `Rollback failed: ${error.message}`
      );

      next(error);
    }
  };