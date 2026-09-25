const {
  ECSClient,
  DescribeServicesCommand,
  DescribeTasksCommand,
  DescribeTaskDefinitionCommand,
  ListTasksCommand
} = require('@aws-sdk/client-ecs');

const REGION = process.env.AWS_REGION || 'ap-south-1';

const CLUSTER =
  process.env.ECS_CLUSTER || 'intelligent-cloud-cluster';

const SERVICE =
  process.env.ECS_SERVICE || 'intelligent-demo-service';

const TASK_FAMILY =
  process.env.ECS_TASK_FAMILY || 'intelligent-cloud-demo-app';

const CONTAINER_NAME =
  process.env.ECS_CONTAINER_NAME || 'demo-app';

const ecsClient = new ECSClient({
  region: REGION
});

/**
 * Get ECS service information.
 */
async function getServiceStatus() {
  const command = new DescribeServicesCommand({
    cluster: CLUSTER,
    services: [SERVICE]
  });

  const response = await ecsClient.send(command);

  if (!response.services || response.services.length === 0) {
    throw new Error(
      `ECS service "${SERVICE}" was not found in cluster "${CLUSTER}".`
    );
  }

  const service = response.services[0];

  return {
    serviceName: service.serviceName,
    clusterArn: service.clusterArn,
    status: service.status,
    desiredCount: service.desiredCount,
    runningCount: service.runningCount,
    pendingCount: service.pendingCount,
    taskDefinition: service.taskDefinition,
    deploymentCount: service.deployments?.length || 0,
    deployments: service.deployments || []
  };
}

/**
 * Get the currently running ECS tasks.
 */
async function getRunningTasks() {
  const listCommand = new ListTasksCommand({
    cluster: CLUSTER,
    serviceName: SERVICE,
    desiredStatus: 'RUNNING'
  });

  const listResponse = await ecsClient.send(listCommand);

  if (!listResponse.taskArns || listResponse.taskArns.length === 0) {
    return [];
  }

  const describeCommand = new DescribeTasksCommand({
    cluster: CLUSTER,
    tasks: listResponse.taskArns
  });

  const response = await ecsClient.send(describeCommand);

  return (response.tasks || []).map(task => {
    const container =
      task.containers?.find(
        item => item.name === CONTAINER_NAME
      ) || task.containers?.[0];

    return {
      taskArn: task.taskArn,
      taskId: task.taskArn?.split('/').pop(),
      lastStatus: task.lastStatus,
      desiredStatus: task.desiredStatus,
      healthStatus: task.healthStatus || null,
      startedAt: task.startedAt || null,
      stoppedAt: task.stoppedAt || null,
      taskDefinitionArn: task.taskDefinitionArn,
      container: container
        ? {
            name: container.name,
            lastStatus: container.lastStatus,
            healthStatus: container.healthStatus || null,
            image: container.image,
            exitCode: container.exitCode ?? null,
            reason: container.reason || null
          }
        : null
    };
  });
}

/**
 * Get the currently registered ECS task definition.
 */
async function getCurrentTaskDefinition() {
  const command = new DescribeTaskDefinitionCommand({
    taskDefinition: TASK_FAMILY
  });

  const response = await ecsClient.send(command);

  const taskDefinition = response.taskDefinition;

  if (!taskDefinition) {
    throw new Error(
      `ECS task definition "${TASK_FAMILY}" was not found.`
    );
  }

  const container =
    taskDefinition.containerDefinitions?.find(
      item => item.name === CONTAINER_NAME
    ) || taskDefinition.containerDefinitions?.[0];

  return {
    family: taskDefinition.family,
    revision: taskDefinition.revision,
    status: taskDefinition.status,
    taskDefinitionArn: taskDefinition.taskDefinitionArn,
    cpu: taskDefinition.cpu,
    memory: taskDefinition.memory,
    container: container
      ? {
          name: container.name,
          image: container.image,
          cpu: container.cpu || 0,
          memory: container.memory || 0
        }
      : null
  };
}

/**
 * Get a complete ECS deployment snapshot.
 */
async function getDeploymentStatus() {
  const [service, tasks, taskDefinition] =
    await Promise.all([
      getServiceStatus(),
      getRunningTasks(),
      getCurrentTaskDefinition()
    ]);

  return {
    region: REGION,
    cluster: CLUSTER,
    service,
    taskDefinition,
    tasks,
    healthy:
      service.desiredCount > 0 &&
      service.runningCount === service.desiredCount &&
      tasks.every(task =>
        ['RUNNING'].includes(task.lastStatus)
      )
  };
}

module.exports = {
  getServiceStatus,
  getRunningTasks,
  getCurrentTaskDefinition,
  getDeploymentStatus
};