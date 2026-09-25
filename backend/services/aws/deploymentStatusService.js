const githubActionsService =
  require('../githubActionsService');

const ecsService =
  require('./ecsService');

const albService =
  require('./albService');

async function getRealDeploymentStatus() {
  const [github, ecs, alb] = await Promise.all([
    githubActionsService.getLatestDeploymentStatus(),
    ecsService.getDeploymentStatus(),
    albService.getALBStatus()
  ]);

  let overallStatus = 'UNKNOWN';

  if (!github.hasRun) {
    overallStatus = 'NO_DEPLOYMENT';
  } else if (
    github.status === 'QUEUED'
  ) {
    overallStatus = 'QUEUED';
  } else if (
    github.status === 'IN_PROGRESS'
  ) {
    overallStatus = 'DEPLOYING';
  } else if (
    github.status === 'FAILED' ||
    github.status === 'CANCELLED' ||
    github.status === 'TIMED_OUT'
  ) {
    overallStatus = 'FAILED';
  } else if (
    github.status === 'SUCCESS'
  ) {
    if (
      ecs.healthy &&
      alb.healthy
    ) {
      overallStatus = 'SUCCESS';
    } else {
      overallStatus = 'HEALTH_CHECK';
    }
  }

  return {
    status: overallStatus,

    github: {
      status: github.status,
      runId: github.run?.id || null,
      runNumber: github.run?.runNumber || null,
      workflowName:
        github.run?.workflowName || null,
      branch:
        github.run?.branch || null,
      commitSha:
        github.run?.commitSha || null,
      commitMessage:
        github.run?.commitMessage || null,
      url:
        github.run?.htmlUrl || null,
      createdAt:
        github.run?.createdAt || null,
      updatedAt:
        github.run?.updatedAt || null
    },

    ecs: {
      healthy: ecs.healthy,
      cluster: ecs.cluster,
      service: ecs.service,
      serviceStatus:
        ecs.service?.status || null,
      desiredCount:
        ecs.service?.desiredCount || 0,
      runningCount:
        ecs.service?.runningCount || 0,
      taskDefinition:
        ecs.taskDefinition || null
    },

    alb: {
      healthy: alb.healthy,
      loadBalancer:
        alb.loadBalancer || null,
      targetGroup:
        alb.targetGroup || null,
      targetHealth:
        alb.targetHealth || null
    },

    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getRealDeploymentStatus
};