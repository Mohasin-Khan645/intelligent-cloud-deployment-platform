const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const Environment = require('../models/Environment');
const logger = require('../utils/logger');

// Background simulation runner for new deployments
const simulatePipeline = (deploymentId, projectId, environment, version) => {
  // Step 1: BUILDING after 3s
  setTimeout(async () => {
    try {
      await Deployment.updateStatus(deploymentId, 'BUILDING');
      logger.info(`Deployment #${deploymentId} transitioned to BUILDING`);
    } catch (e) {
      logger.error(`Pipeline simulation error: ${e.message}`);
    }
  }, 3000);

  // Step 2: DEPLOYING after 7s
  setTimeout(async () => {
    try {
      await Deployment.updateStatus(deploymentId, 'DEPLOYING');
      logger.info(`Deployment #${deploymentId} transitioned to DEPLOYING`);
    } catch (e) {
      logger.error(`Pipeline simulation error: ${e.message}`);
    }
  }, 7000);

  // Step 3: SUCCESS after 12s
  setTimeout(async () => {
    try {
      await Deployment.updateStatus(deploymentId, 'SUCCESS', null, new Date());
      logger.info(`Deployment #${deploymentId} completed with status SUCCESS`);
    } catch (e) {
      logger.error(`Pipeline simulation error: ${e.message}`);
    }
  }, 12000);
};

exports.getAllDeployments = async (req, res, next) => {
  try {
    const { projectId, environment } = req.query;
    const deployments = await Deployment.findAll({ projectId, environment });
    res.status(200).json({ data: deployments });
  } catch (error) {
    next(error);
  }
};

exports.getDeploymentById = async (req, res, next) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found.' });
    }

    const logs = Deployment.getLogs(deployment);

    res.status(200).json({
      data: {
        ...deployment,
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createDeployment = async (req, res, next) => {
  try {
    const { project_id, version, commit_sha, environment, status, error_message, simulate } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required to trigger a deployment.' });
    }

    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Referenced project does not exist.' });
    }

    const initialStatus = status || (simulate !== false ? 'QUEUED' : 'SUCCESS');

    const deployment = await Deployment.create({
      project_id,
      version: version || `v1.0.${Math.floor(Math.random() * 90 + 10)}`,
      commit_sha: commit_sha || Math.random().toString(16).substring(2, 9),
      environment: environment || 'Production',
      status: initialStatus,
      error_message: error_message || null
    });

    // If initial status is QUEUED and simulation is enabled, step through statuses
    if (initialStatus === 'QUEUED' && simulate !== false) {
      simulatePipeline(deployment.id, project_id, deployment.environment, deployment.version);
    }

    logger.info(`Deployment initiated: ID #${deployment.id} (${deployment.version}) for Project #${project_id}`);
    res.status(201).json({
      message: 'Deployment initiated successfully',
      data: deployment
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeploymentLogs = async (req, res, next) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found.' });
    }

    const logs = Deployment.getLogs(deployment);
    res.status(200).json({ data: logs });
  } catch (error) {
    next(error);
  }
};

exports.getMonitoringMetrics = async (req, res, next) => {
  try {
    const [deployments, environments] = await Promise.all([
      Deployment.findAll(),
      Environment.findAll()
    ]);

    const activeDeployments = deployments.filter(d => ['QUEUED', 'BUILDING', 'DEPLOYING'].includes(d.status)).length;
    const healthyEnvironments = environments.filter(e => e.status === 'Healthy').length;

    // CloudWatch-ready structure with simulated metric streams
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        status: 'Healthy',
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform
      },
      resources: {
        cpuUsagePercent: (Math.random() * 8 + 12).toFixed(1), // ~12% - 20%
        memoryUsagePercent: (Math.random() * 5 + 38).toFixed(1), // ~38% - 43%
        activeConnections: Math.floor(Math.random() * 12 + 8),
        totalRequestsHandled: 14829
      },
      infrastructure: {
        activeDeployments,
        healthyEnvironments,
        totalEnvironments: environments.length,
        cloudWatchConfigured: false,
        note: 'Local simulated telemetry. Ready for CloudWatch agent integration in Phase 2.'
      }
    };

    res.status(200).json({ data: metrics });
  } catch (error) {
    next(error);
  }
};

