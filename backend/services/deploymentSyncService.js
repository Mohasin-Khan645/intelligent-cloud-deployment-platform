const githubActionsService =
  require('./githubActionsService');

const ecsService =
  require('./aws/ecsService');

const albService =
  require('./aws/albService');

const Deployment =
  require('../models/Deployment');


/**
 * Convert GitHub Actions status/conclusion
 * into our platform deployment status.
 */
function mapGitHubStatus(run) {
  if (!run) {
    return 'UNKNOWN';
  }

  if (run.status === 'queued') {
    return 'QUEUED';
  }

  if (
    run.status === 'in_progress' ||
    run.status === 'waiting' ||
    run.status === 'requested'
  ) {
    return 'BUILDING';
  }

  if (run.status === 'completed') {
    switch (run.conclusion) {
      case 'success':
        return 'SUCCESS';

      case 'failure':
        return 'FAILED';

      case 'cancelled':
        return 'CANCELLED';

      case 'timed_out':
        return 'TIMED_OUT';

      case 'action_required':
        return 'FAILED';

      case 'startup_failure':
        return 'FAILED';

      default:
        return 'FAILED';
    }
  }

  return 'UNKNOWN';
}


/**
 * Extract the image tag from an ECS image URI.
 *
 * Example:
 *
 * 688674375439.dkr.ecr.ap-south-1.amazonaws.com/
 * intelligent-cloud-demo-app:
 * 3e3047957d79bbc72e6d3626e4b511801625b96b
 *
 * Returns:
 *
 * 3e3047957d79bbc72e6d3626e4b511801625b96b
 */
function extractImageTag(image) {
  if (!image || typeof image !== 'string') {
    return null;
  }

  const lastColon = image.lastIndexOf(':');

  if (lastColon === -1) {
    return null;
  }

  return image.substring(lastColon + 1);
}


/**
 * Verify that ECS is actually running
 * the commit belonging to this deployment.
 */
function verifyDeploymentCommit(
  expectedCommitSha,
  ecsStatus
) {
  const taskDefinition =
    ecsStatus?.taskDefinition || null;

  const container =
    taskDefinition?.container || null;

  const runningImage =
    container?.image || null;

  const runningCommitSha =
    extractImageTag(runningImage);

  const expected =
    expectedCommitSha
      ? String(expectedCommitSha).trim()
      : null;

  const actual =
    runningCommitSha
      ? String(runningCommitSha).trim()
      : null;

  const commitMatches =
    Boolean(expected) &&
    Boolean(actual) &&
    expected === actual;

  return {
    expectedCommitSha: expected,
    runningCommitSha: actual,
    runningImage,
    commitMatches
  };
}


/**
 * Verify the AWS deployment after GitHub Actions succeeds.
 *
 * Required conditions:
 *
 * 1. ECS service is ACTIVE
 * 2. ECS desired count == running count
 * 3. ECS deployment rollout state == COMPLETED
 * 4. At least one running task exists
 * 5. Running ECS task is HEALTHY
 * 6. ECS is running the expected deployment commit
 * 7. ALB is ACTIVE
 * 8. ALB has at least one healthy target
 * 9. ALB has no unhealthy targets
 */
async function verifyAwsDeployment(
  expectedCommitSha = null
) {
  const [
    ecsStatus,
    albStatus
  ] = await Promise.all([
    ecsService.getDeploymentStatus(),
    albService.getALBStatus()
  ]);


  /*
   * ---------------------------------------------------------
   * ECS SERVICE VALIDATION
   * ---------------------------------------------------------
   */

  const service =
    ecsStatus.service;

  const serviceActive =
    service &&
    service.status === 'ACTIVE';

  const desiredCount =
    Number(service?.desiredCount || 0);

  const runningCount =
    Number(service?.runningCount || 0);

  const ecsCountsHealthy =
    desiredCount > 0 &&
    runningCount === desiredCount;


  /*
   * ---------------------------------------------------------
   * ECS ROLLOUT VALIDATION
   * ---------------------------------------------------------
   */

  const deployments =
    service?.deployments || [];

  const primaryDeployment =
    deployments.find(
      deployment =>
        deployment.status === 'PRIMARY'
    ) ||
    deployments[0] ||
    null;

  const rolloutState =
    primaryDeployment?.rolloutState || null;

  const rolloutCompleted =
    rolloutState === 'COMPLETED';


  /*
   * ---------------------------------------------------------
   * ECS TASK VALIDATION
   * ---------------------------------------------------------
   */

  const tasks =
    ecsStatus.tasks || [];

  const runningTasks =
    tasks.filter(
      task =>
        task.lastStatus === 'RUNNING'
    );

  const healthyTasks =
    runningTasks.filter(
      task =>
        task.healthStatus === 'HEALTHY' ||
        task.container?.healthStatus === 'HEALTHY'
    );

  const taskHealthy =
    runningTasks.length > 0 &&
    healthyTasks.length === runningTasks.length;


  /*
   * ---------------------------------------------------------
   * ECS COMMIT VALIDATION
   * ---------------------------------------------------------
   */

  const commitVerification =
    verifyDeploymentCommit(
      expectedCommitSha,
      ecsStatus
    );


  /*
   * ---------------------------------------------------------
   * ALB VALIDATION
   * ---------------------------------------------------------
   */

  const loadBalancer =
    albStatus.loadBalancer;

  const targetHealth =
    albStatus.targetHealth;

  const albActive =
    loadBalancer?.state === 'active';

  const albTargetsHealthy =
    targetHealth?.healthy === true &&
    Number(targetHealth?.healthyTargets || 0) > 0 &&
    Number(targetHealth?.unhealthyTargets || 0) === 0;


  /*
   * ---------------------------------------------------------
   * FINAL AWS VALIDATION
   * ---------------------------------------------------------
   */

  const awsHealthy =
    serviceActive &&
    ecsCountsHealthy &&
    rolloutCompleted &&
    taskHealthy &&
    commitVerification.commitMatches &&
    albActive &&
    albTargetsHealthy;


  return {
    healthy: awsHealthy,

    ecs: {
      serviceActive,

      desiredCount,

      runningCount,

      countsHealthy:
        ecsCountsHealthy,

      rolloutState,

      rolloutCompleted,

      runningTasks:
        runningTasks.length,

      healthyTasks:
        healthyTasks.length,

      taskHealthy,

      serviceName:
        service?.serviceName || null,

      taskDefinition:
        service?.taskDefinition || null
    },

    commit: {
      expectedCommitSha:
        commitVerification.expectedCommitSha,

      runningCommitSha:
        commitVerification.runningCommitSha,

      runningImage:
        commitVerification.runningImage,

      matches:
        commitVerification.commitMatches
    },

    alb: {
      active:
        albActive,

      loadBalancerName:
        loadBalancer?.name || null,

      dnsName:
        loadBalancer?.dnsName || null,

      targetGroupName:
        albStatus.targetGroup?.name || null,

      totalTargets:
        targetHealth?.totalTargets || 0,

      healthyTargets:
        targetHealth?.healthyTargets || 0,

      unhealthyTargets:
        targetHealth?.unhealthyTargets || 0,

      initialTargets:
        targetHealth?.initialTargets || 0,

      targetsHealthy:
        albTargetsHealthy
    }
  };
}


/**
 * Synchronize one PostgreSQL deployment
 * with its corresponding GitHub Actions run
 * and AWS infrastructure.
 */
async function syncDeployment(
  deploymentId
) {
  const deployment =
    await Deployment.findById(
      deploymentId
    );


  /*
   * ---------------------------------------------------------
   * DEPLOYMENT VALIDATION
   * ---------------------------------------------------------
   */

  if (!deployment) {
    throw new Error(
      `Deployment ${deploymentId} not found.`
    );
  }

  if (!deployment.github_run_id) {
    throw new Error(
      `Deployment ${deploymentId} does not have a GitHub Actions run ID.`
    );
  }


  /*
   * ---------------------------------------------------------
   * GET GITHUB ACTIONS STATUS
   * ---------------------------------------------------------
   */

  const githubRun =
    await githubActionsService.getWorkflowRun(
      deployment.github_run_id
    );

  const githubStatus =
    mapGitHubStatus(githubRun);


  /*
   * ---------------------------------------------------------
   * DEFAULT VALUES
   * ---------------------------------------------------------
   */

  let newStatus =
    githubStatus;

  let errorMessage = null;

  let awsVerification = null;


  /*
   * ---------------------------------------------------------
   * GITHUB FAILURE
   * ---------------------------------------------------------
   */

  if (
    githubStatus === 'FAILED' ||
    githubStatus === 'CANCELLED' ||
    githubStatus === 'TIMED_OUT'
  ) {
    errorMessage =
      githubRun.conclusion
        ? `GitHub Actions workflow concluded with: ${githubRun.conclusion}`
        : 'GitHub Actions deployment failed.';
  }


  /*
   * ---------------------------------------------------------
   * GITHUB SUCCESS
   * ---------------------------------------------------------
   *
   * GitHub success is NOT enough.
   *
   * Verify:
   *
   * GitHub
   *   ↓
   * Commit SHA
   *   ↓
   * ECS image
   *   ↓
   * ECS rollout
   *   ↓
   * ECS task health
   *   ↓
   * ALB health
   */

  if (githubStatus === 'SUCCESS') {
    try {

      awsVerification =
        await verifyAwsDeployment(
          deployment.commit_sha
        );


      if (awsVerification.healthy) {

        /*
         * Everything is healthy and the
         * correct commit is actually running.
         */

        newStatus =
          'SUCCESS';

        errorMessage =
          null;

      } else {

        /*
         * GitHub succeeded but AWS deployment
         * is not fully verified yet.
         */

        newStatus =
          'DEPLOYING';

        const problems = [];


        if (
          !awsVerification.ecs.serviceActive
        ) {
          problems.push(
            'ECS service is not ACTIVE'
          );
        }


        if (
          !awsVerification.ecs.countsHealthy
        ) {
          problems.push(
            `ECS desired/running count mismatch (${awsVerification.ecs.desiredCount}/${awsVerification.ecs.runningCount})`
          );
        }


        if (
          !awsVerification.ecs.rolloutCompleted
        ) {
          problems.push(
            `ECS rollout state is ${awsVerification.ecs.rolloutState || 'UNKNOWN'}`
          );
        }


        if (
          !awsVerification.ecs.taskHealthy
        ) {
          problems.push(
            `ECS healthy tasks: ${awsVerification.ecs.healthyTasks}/${awsVerification.ecs.runningTasks}`
          );
        }


        if (
          !awsVerification.commit.matches
        ) {
          problems.push(
            `ECS commit mismatch: expected ${awsVerification.commit.expectedCommitSha || 'UNKNOWN'}, running ${awsVerification.commit.runningCommitSha || 'UNKNOWN'}`
          );
        }


        if (
          !awsVerification.alb.active
        ) {
          problems.push(
            'ALB is not ACTIVE'
          );
        }


        if (
          !awsVerification.alb.targetsHealthy
        ) {
          problems.push(
            `ALB healthy targets: ${awsVerification.alb.healthyTargets}/${awsVerification.alb.totalTargets}`
          );
        }


        errorMessage =
          `GitHub Actions succeeded, but AWS deployment verification is still pending: ${problems.join('; ')}`;
      }

    } catch (awsError) {

      /*
       * Do NOT incorrectly mark the deployment
       * as SUCCESS if AWS verification fails.
       */

      console.warn(
        `AWS deployment verification failed for deployment ${deploymentId}:`,
        awsError.message
      );

      newStatus =
        'DEPLOYING';

      errorMessage =
        `GitHub Actions succeeded, but AWS deployment verification could not be completed: ${awsError.message}`;
    }
  }


  /*
   * ---------------------------------------------------------
   * COMPLETION TIME
   * ---------------------------------------------------------
   */

  const completedAt =
    newStatus === 'SUCCESS' ||
    newStatus === 'FAILED' ||
    newStatus === 'CANCELLED' ||
    newStatus === 'TIMED_OUT'
      ? (
          githubRun.updated_at ||
          githubRun.updatedAt ||
          new Date().toISOString()
        )
      : null;


  /*
   * ---------------------------------------------------------
   * UPDATE DATABASE
   * ---------------------------------------------------------
   */

  const updatedDeployment =
    await Deployment.updateStatus(
      deployment.id,
      newStatus,
      errorMessage,
      completedAt
    );


  /*
   * ---------------------------------------------------------
   * RETURN COMPLETE STATUS
   * ---------------------------------------------------------
   */

  return {
    deployment:
      updatedDeployment,

    github: {
      runId:
        githubRun.id,

      runNumber:
        githubRun.run_number,

      status:
        githubRun.status,

      conclusion:
        githubRun.conclusion,

      branch:
        githubRun.head_branch,

      commitSha:
        githubRun.head_sha,

      workflowName:
        githubRun.name,

      url:
        githubRun.html_url,

      createdAt:
        githubRun.created_at,

      updatedAt:
        githubRun.updated_at
    },

    aws:
      awsVerification
  };
}


module.exports = {
  syncDeployment,
  mapGitHubStatus,
  verifyAwsDeployment
};