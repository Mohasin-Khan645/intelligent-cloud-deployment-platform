const Deployment = require('../models/Deployment');
const deploymentSyncService = require('./deploymentSyncService');
const logger = require('../utils/logger');

let syncInterval = null;
let isSyncing = false;

async function syncActiveDeployments() {
  if (isSyncing) {
    return;
  }

  isSyncing = true;

  try {
    const deployments = await Deployment.findAll();

    const activeDeployments = deployments.filter(
      deployment =>
        deployment.github_run_id &&
        ['QUEUED', 'BUILDING', 'DEPLOYING', 'HEALTH_CHECK'].includes(
          deployment.status
        )
    );

    if (activeDeployments.length === 0) {
      return;
    }

    logger.info(
      `Automatic deployment sync: checking ${activeDeployments.length} active deployment(s).`
    );

    for (const deployment of activeDeployments) {
      try {
        const result =
          await deploymentSyncService.syncDeployment(
            deployment.id
          );

        logger.info(
          `Deployment #${deployment.id} synchronized: ${result.deployment?.status}`
        );
      } catch (error) {
        logger.error(
          `Failed to synchronize deployment #${deployment.id}: ${error.message}`
        );
      }
    }
  } catch (error) {
    logger.error(
      `Automatic deployment sync failed: ${error.message}`
    );
  } finally {
    isSyncing = false;
  }
}

function startDeploymentAutoSync(intervalMs = 10000) {
  if (syncInterval) {
    return;
  }

  logger.info(
    `Starting automatic deployment synchronization every ${intervalMs / 1000} seconds.`
  );

  syncActiveDeployments();

  syncInterval = setInterval(
    syncActiveDeployments,
    intervalMs
  );
}

function stopDeploymentAutoSync() {
  if (!syncInterval) {
    return;
  }

  clearInterval(syncInterval);
  syncInterval = null;

  logger.info(
    'Automatic deployment synchronization stopped.'
  );
}

module.exports = {
  syncActiveDeployments,
  startDeploymentAutoSync,
  stopDeploymentAutoSync
};