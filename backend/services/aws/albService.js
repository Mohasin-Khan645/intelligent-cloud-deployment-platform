const {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand
} = require('@aws-sdk/client-elastic-load-balancing-v2');

const REGION = process.env.AWS_REGION || 'ap-south-1';

const TARGET_GROUP_NAME =
  process.env.ECS_TARGET_GROUP || 'intelligent-demo-tg';

const ALB_NAME =
  process.env.ALB_NAME || 'intelligent-demo-alb';

const albClient = new ElasticLoadBalancingV2Client({
  region: REGION
});

/**
 * Get ALB information.
 */
async function getLoadBalancerStatus() {
  const command = new DescribeLoadBalancersCommand({
    Names: [ALB_NAME]
  });

  const response = await albClient.send(command);

  if (!response.LoadBalancers || response.LoadBalancers.length === 0) {
    throw new Error(
      `Load balancer "${ALB_NAME}" was not found.`
    );
  }

  const loadBalancer = response.LoadBalancers[0];

  return {
    name: loadBalancer.LoadBalancerName,
    arn: loadBalancer.LoadBalancerArn,
    dnsName: loadBalancer.DNSName,
    state: loadBalancer.State?.Code || null,
    type: loadBalancer.Type,
    scheme: loadBalancer.Scheme,
    vpcId: loadBalancer.VpcId,
    availabilityZones:
      loadBalancer.AvailabilityZones?.map(zone => zone.ZoneName) || []
  };
}

/**
 * Get target group information.
 */
async function getTargetGroupStatus() {
  const command = new DescribeTargetGroupsCommand({
    Names: [TARGET_GROUP_NAME]
  });

  const response = await albClient.send(command);

  if (!response.TargetGroups || response.TargetGroups.length === 0) {
    throw new Error(
      `Target group "${TARGET_GROUP_NAME}" was not found.`
    );
  }

  const targetGroup = response.TargetGroups[0];

  return {
    name: targetGroup.TargetGroupName,
    arn: targetGroup.TargetGroupArn,
    protocol: targetGroup.Protocol,
    port: targetGroup.Port,
    targetType: targetGroup.TargetType,
    healthCheckPath: targetGroup.HealthCheckPath,
    healthCheckPort: targetGroup.HealthCheckPort,
    healthCheckProtocol: targetGroup.HealthCheckProtocol,
    matcher: targetGroup.Matcher?.HttpCode || null,
    vpcId: targetGroup.VpcId
  };
}

/**
 * Get actual target health.
 */
async function getTargetHealth() {
  const targetGroup = await getTargetGroupStatus();

  const command = new DescribeTargetHealthCommand({
    TargetGroupArn: targetGroup.arn
  });

  const response = await albClient.send(command);

  const targets = (response.TargetHealthDescriptions || []).map(
    item => ({
      id: item.Target?.Id || null,
      port: item.Target?.Port || null,
      availabilityZone:
        item.Target?.AvailabilityZone || null,
      state: item.TargetHealth?.State || null,
      reason: item.TargetHealth?.Reason || null,
      description:
        item.TargetHealth?.Description || null
    })
  );

  const healthyTargets = targets.filter(
    target => target.state === 'healthy'
  );

  const unhealthyTargets = targets.filter(
    target => target.state === 'unhealthy'
  );

  const initialTargets = targets.filter(
    target => target.state === 'initial'
  );

  return {
    targets,
    totalTargets: targets.length,
    healthyTargets: healthyTargets.length,
    unhealthyTargets: unhealthyTargets.length,
    initialTargets: initialTargets.length,
    healthy: targets.length > 0 && unhealthyTargets.length === 0
  };
}

/**
 * Get complete ALB deployment status.
 */
async function getALBStatus() {
  const [loadBalancer, targetGroup, targetHealth] =
    await Promise.all([
      getLoadBalancerStatus(),
      getTargetGroupStatus(),
      getTargetHealth()
    ]);

  return {
    region: REGION,
    loadBalancer,
    targetGroup,
    targetHealth,
    healthy:
      loadBalancer.state === 'active' &&
      targetHealth.healthy
  };
}

module.exports = {
  getLoadBalancerStatus,
  getTargetGroupStatus,
  getTargetHealth,
  getALBStatus
};