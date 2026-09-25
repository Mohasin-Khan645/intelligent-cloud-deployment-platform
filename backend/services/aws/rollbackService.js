const {
  ECSClient,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ListTasksCommand,
  DescribeTaskDefinitionCommand,
  ListTaskDefinitionsCommand,
  UpdateServiceCommand,
  waitUntilServicesStable
} = require('@aws-sdk/client-ecs');

const Deployment =
  require('../../models/Deployment');

const albService =
  require('./albService');


const ecsClient = new ECSClient({
  region:
    process.env.AWS_REGION || 'ap-south-1'
});


const CLUSTER_NAME =
  process.env.ECS_CLUSTER ||
  'intelligent-cloud-cluster';


const SERVICE_NAME =
  process.env.ECS_SERVICE ||
  'intelligent-demo-service';


const CONTAINER_NAME =
  process.env.ECS_CONTAINER_NAME ||
  'demo-app';


const TASK_FAMILY =
  process.env.ECS_TASK_FAMILY ||
  'intelligent-cloud-demo-app';


/*
 * ---------------------------------------------------------
 * GET CURRENT ECS SERVICE
 * ---------------------------------------------------------
 */

async function getService() {
  const result =
    await ecsClient.send(
      new DescribeServicesCommand({
        cluster: CLUSTER_NAME,
        services: [SERVICE_NAME]
      })
    );

  const service =
    result.services?.[0];

  if (!service) {
    throw new Error(
      `ECS service '${SERVICE_NAME}' was not found.`
    );
  }

  return service;
}


/*
 * ---------------------------------------------------------
 * GET CURRENT TASK DEFINITION
 * ---------------------------------------------------------
 */

async function getCurrentTaskDefinition() {
  const service =
    await getService();

  if (!service.taskDefinition) {
    throw new Error(
      'Current ECS task definition was not found.'
    );
  }

  return service.taskDefinition;
}


/*
 * ---------------------------------------------------------
 * FIND PREVIOUS SUCCESSFUL DEPLOYMENT
 * ---------------------------------------------------------
 *
 * We deliberately use the platform database instead of
 * simply assuming ECS revision N-1 is the correct version.
 *
 * Example:
 *
 * Deployment 13 = SUCCESS
 * Deployment 14 = FAILED
 * Deployment 15 = SUCCESS
 *
 * If rolling back deployment 15, we want deployment 13,
 * not necessarily ECS revision 14.
 * ---------------------------------------------------------
 */

async function findPreviousSuccessfulDeployment(
  currentDeploymentId
) {
  const deployments =
    await Deployment.findAll();

  if (
    !Array.isArray(deployments) ||
    deployments.length === 0
  ) {
    throw new Error(
      'No deployment history was found.'
    );
  }


  const currentDeployment =
    deployments.find(
      deployment =>
        Number(deployment.id) ===
        Number(currentDeploymentId)
    );


  if (!currentDeployment) {
    throw new Error(
      `Deployment ${currentDeploymentId} was not found in deployment history.`
    );
  }


  const currentProjectId =
    currentDeployment.project_id;


  const currentEnvironment =
    currentDeployment.environment;


  const previousDeployments =
    deployments
      .filter(deployment => {

        if (
          Number(deployment.id) >=
          Number(currentDeploymentId)
        ) {
          return false;
        }


        if (
          deployment.status !==
          'SUCCESS'
        ) {
          return false;
        }


        if (
          currentProjectId != null &&
          deployment.project_id != null &&
          Number(deployment.project_id) !==
          Number(currentProjectId)
        ) {
          return false;
        }


        if (
          currentEnvironment &&
          deployment.environment &&
          deployment.environment !==
          currentEnvironment
        ) {
          return false;
        }


        return true;
      })
      .sort(
        (a, b) =>
          Number(b.id) -
          Number(a.id)
      );


  if (
    previousDeployments.length === 0
  ) {
    throw new Error(
      'No previous successful deployment was found for rollback.'
    );
  }


  const previousDeployment =
    previousDeployments[0];


  if (
    !previousDeployment.commit_sha
  ) {
    throw new Error(
      `Previous successful deployment ${previousDeployment.id} does not have a commit SHA.`
    );
  }


  return previousDeployment;
}


/*
 * ---------------------------------------------------------
 * FIND ECS TASK DEFINITION BY COMMIT SHA
 * ---------------------------------------------------------
 *
 * Your GitHub Actions workflow pushes Docker images using
 * the Git commit SHA.
 *
 * Example:
 *
 * intelligent-cloud-demo-app:
 *   dfa679356eba589e128c732c01da11aade171a05
 *
 * We search ECS task definitions for the task definition
 * that points to the previous successful deployment's
 * commit.
 * ---------------------------------------------------------
 */

async function findTaskDefinitionByCommitSha(
  commitSha
) {
  if (!commitSha) {
    throw new Error(
      'Commit SHA is required to find the ECS task definition.'
    );
  }


  let nextToken;


  const taskDefinitionArns = [];


  do {

    const response =
      await ecsClient.send(
        new ListTaskDefinitionsCommand({
          familyPrefix:
            TASK_FAMILY,

          status:
            'ACTIVE',

          sort:
            'DESC',

          maxResults:
            100,

          nextToken
        })
      );


    if (
      response.taskDefinitionArns
    ) {
      taskDefinitionArns.push(
        ...response.taskDefinitionArns
      );
    }


    nextToken =
      response.nextToken;

  } while (nextToken);


  if (
    taskDefinitionArns.length === 0
  ) {
    throw new Error(
      `No active ECS task definitions were found for family '${TASK_FAMILY}'.`
    );
  }


  for (
    const taskDefinitionArn
    of taskDefinitionArns
  ) {

    const response =
      await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition:
            taskDefinitionArn
        })
      );


    const taskDefinition =
      response.taskDefinition;


    if (!taskDefinition) {
      continue;
    }


    const container =
      taskDefinition
        .containerDefinitions
        ?.find(
          item =>
            item.name ===
            CONTAINER_NAME
        ) ||
      taskDefinition
        .containerDefinitions
        ?.[0];


    const image =
      container?.image || '';


    /*
     * Match the deployment commit SHA against
     * the Docker image tag.
     *
     * We use includes rather than exact equality
     * because the image contains the complete ECR URL.
     */

    if (
      image.includes(commitSha)
    ) {

      return {
        arn:
          taskDefinition.taskDefinitionArn,

        family:
          taskDefinition.family,

        revision:
          taskDefinition.revision,

        image,

        commitSha
      };
    }
  }


  throw new Error(
    `No ECS task definition was found for commit SHA '${commitSha}'.`
  );
}


/*
 * ---------------------------------------------------------
 * UPDATE ECS SERVICE
 * ---------------------------------------------------------
 */

async function updateService(
  taskDefinitionArn
) {
  const result =
    await ecsClient.send(
      new UpdateServiceCommand({
        cluster:
          CLUSTER_NAME,

        service:
          SERVICE_NAME,

        taskDefinition:
          taskDefinitionArn
      })
    );


  return result.service;
}


/*
 * ---------------------------------------------------------
 * WAIT FOR ECS STABILITY
 * ---------------------------------------------------------
 */

async function waitForServiceStability() {

  const waiter =
    await waitUntilServicesStable(
      {
        client:
          ecsClient,

        maxWaitTime:
          300,

        minDelay:
          5,

        maxDelay:
          15
      },

      {
        cluster:
          CLUSTER_NAME,

        services:
          [SERVICE_NAME]
      }
    );


  if (
    waiter.state !==
    'SUCCESS'
  ) {
    throw new Error(
      `ECS rollback did not reach a stable state. Waiter state: ${waiter.state}`
    );
  }


  return waiter;
}


/*
 * ---------------------------------------------------------
 * VERIFY ECS TASK HEALTH
 * ---------------------------------------------------------
 */

async function verifyEcsHealth() {

  const service =
    await getService();


  const desiredCount =
    Number(
      service.desiredCount || 0
    );


  const runningCount =
    Number(
      service.runningCount || 0
    );


  if (
    desiredCount <= 0
  ) {
    throw new Error(
      'ECS service desired count is zero after rollback.'
    );
  }


  if (
    runningCount !==
    desiredCount
  ) {
    throw new Error(
      `ECS service is not fully running after rollback. Desired: ${desiredCount}, Running: ${runningCount}.`
    );
  }


  const listResponse =
    await ecsClient.send(
      new ListTasksCommand({
        cluster:
          CLUSTER_NAME,

        serviceName:
          SERVICE_NAME,

        desiredStatus:
          'RUNNING'
      })
    );


  const taskArns =
    listResponse.taskArns || [];


  if (
    taskArns.length === 0
  ) {
    throw new Error(
      'No running ECS tasks were found after rollback.'
    );
  }


  const describeResponse =
    await ecsClient.send(
      new DescribeTasksCommand({
        cluster:
          CLUSTER_NAME,

        tasks:
          taskArns
      })
    );


  const tasks =
    describeResponse.tasks || [];


  const unhealthyTasks =
    tasks.filter(task => {

      const container =
        task.containers?.find(
          item =>
            item.name ===
            CONTAINER_NAME
        ) ||
        task.containers?.[0];


      const taskHealthy =
        task.healthStatus ===
        'HEALTHY';


      const containerHealthy =
        container?.healthStatus ===
        'HEALTHY';


      return !(
        taskHealthy ||
        containerHealthy
      );
    });


  if (
    unhealthyTasks.length > 0
  ) {
    throw new Error(
      `${unhealthyTasks.length} ECS task(s) are not healthy after rollback.`
    );
  }


  return {
    desiredCount,
    runningCount,
    runningTasks:
      tasks.length,
    healthyTasks:
      tasks.length -
      unhealthyTasks.length
  };
}


/*
 * ---------------------------------------------------------
 * VERIFY ALB HEALTH
 * ---------------------------------------------------------
 */

async function verifyAlbHealth() {

  const albStatus =
    await albService.getALBStatus();


  if (
    !albStatus.healthy
  ) {
    throw new Error(
      `ALB is not healthy after rollback. Healthy targets: ${albStatus.targetHealth?.healthyTargets || 0}/${albStatus.targetHealth?.totalTargets || 0}.`
    );
  }


  return {
    healthy:
      true,

    loadBalancer:
      albStatus.loadBalancer,

    targetGroup:
      albStatus.targetGroup,

    targetHealth:
      albStatus.targetHealth
  };
}


/*
 * ---------------------------------------------------------
 * ROLLBACK
 * ---------------------------------------------------------
 *
 * currentDeploymentId is now required.
 *
 * Example:
 *
 * rollbackToPreviousRevision(17)
 *
 * will:
 *
 * 17
 * ↓
 * find previous SUCCESS deployment
 * ↓
 * find its commit SHA
 * ↓
 * find matching ECS task definition
 * ↓
 * update ECS
 * ↓
 * wait
 * ↓
 * verify ECS
 * ↓
 * verify ALB
 * ---------------------------------------------------------
 */

async function rollbackToPreviousRevision(
  currentDeploymentId
) {

  if (
    currentDeploymentId == null
  ) {
    throw new Error(
      'Deployment ID is required to perform a safe rollback.'
    );
  }


  /*
   * Current ECS version.
   */

  const currentTaskDefinition =
    await getCurrentTaskDefinition();


  /*
   * Previous successful platform deployment.
   */

  const previousDeployment =
    await findPreviousSuccessfulDeployment(
      currentDeploymentId
    );


  /*
   * Find exact ECS revision corresponding
   * to that deployment's commit.
   */

  const rollbackTaskDefinition =
    await findTaskDefinitionByCommitSha(
      previousDeployment.commit_sha
    );


  /*
   * Prevent unnecessary rollback to the
   * currently running task definition.
   */

  if (
    rollbackTaskDefinition.arn ===
    currentTaskDefinition
  ) {
    throw new Error(
      'The previous successful deployment is already running in ECS. No rollback is required.'
    );
  }


  /*
   * Update ECS service.
   */

  const updateResult =
    await updateService(
      rollbackTaskDefinition.arn
    );


  /*
   * Wait until ECS finishes deployment.
   */

  await waitForServiceStability();


  /*
   * Verify actual ECS task health.
   */

  const ecsHealth =
    await verifyEcsHealth();


  /*
   * Verify actual ALB health.
   */

  const albHealth =
    await verifyAlbHealth();


  /*
   * Final result.
   */

  return {

    success:
      true,

    cluster:
      CLUSTER_NAME,

    service:
      SERVICE_NAME,


    previousDeployment: {
      id:
        previousDeployment.id,

      version:
        previousDeployment.version,

      commitSha:
        previousDeployment.commit_sha,

      environment:
        previousDeployment.environment,

      status:
        previousDeployment.status
    },


    previousTaskDefinition:
      currentTaskDefinition,


    rollbackTaskDefinition:
      rollbackTaskDefinition.arn,


    rollbackRevision:
      rollbackTaskDefinition.revision,


    rollbackImage:
      rollbackTaskDefinition.image,


    serviceStatus:
      updateResult?.status ||
      null,


    desiredCount:
      ecsHealth.desiredCount,


    runningCount:
      ecsHealth.runningCount,


    ecs:
      ecsHealth,


    alb:
      albHealth
  };
}


module.exports = {
  getCurrentTaskDefinition,
  findPreviousSuccessfulDeployment,
  findTaskDefinitionByCommitSha,
  verifyEcsHealth,
  verifyAlbHealth,
  rollbackToPreviousRevision
};