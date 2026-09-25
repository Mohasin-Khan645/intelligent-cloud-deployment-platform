const {
  CloudWatchClient,
  GetMetricDataCommand
} = require('@aws-sdk/client-cloudwatch');

const REGION = process.env.AWS_REGION || 'ap-south-1';

const CLUSTER =
  process.env.ECS_CLUSTER || 'intelligent-cloud-cluster';

const SERVICE =
  process.env.ECS_SERVICE || 'intelligent-demo-service';

const cloudWatchClient = new CloudWatchClient({
  region: REGION
});

/**
 * CloudWatch query time window.
 * Retrieves the last 10 minutes of metrics.
 */
function getTimeWindow() {
  const endTime = new Date();

  const startTime = new Date(
    endTime.getTime() - 10 * 60 * 1000
  );

  return {
    startTime,
    endTime
  };
}

/**
 * Extract the LoadBalancer dimension used by CloudWatch.
 *
 * Example ARN:
 *
 * arn:aws:elasticloadbalancing:ap-south-1:123456789012:
 * loadbalancer/app/intelligent-demo-alb/abc123
 *
 * CloudWatch dimension:
 *
 * app/intelligent-demo-alb/abc123
 */
function getLoadBalancerDimension(arn) {
  if (!arn) {
    return null;
  }

  const marker = ':loadbalancer/';

  const index = arn.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return arn.substring(index + marker.length);
}

/**
 * Extract the TargetGroup dimension used by CloudWatch.
 *
 * Example ARN:
 *
 * arn:aws:elasticloadbalancing:ap-south-1:123456789012:
 * targetgroup/intelligent-demo-tg/abc123
 *
 * CloudWatch dimension:
 *
 * targetgroup/intelligent-demo-tg/abc123
 */
function getTargetGroupDimension(arn) {
  if (!arn) {
    return null;
  }

  const marker = ':targetgroup/';

  const index = arn.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return arn.substring(index + marker.length);
}

/**
 * Execute a CloudWatch GetMetricData request.
 */
async function getMetricData(metrics) {
  const {
    startTime,
    endTime
  } = getTimeWindow();

  const command = new GetMetricDataCommand({
    StartTime: startTime,
    EndTime: endTime,

    MetricDataQueries: metrics.map(
      (metric, index) => ({
        Id: metric.id || `metric${index}`,

        MetricStat: {
          Metric: {
            Namespace: metric.namespace,
            MetricName: metric.metricName,
            Dimensions: metric.dimensions
          },

          Period: 300,

          Stat: metric.stat || 'Average'
        },

        ReturnData: true
      })
    )
  });

  const response =
    await cloudWatchClient.send(command);

  return response.MetricDataResults || [];
}

/**
 * Get ECS CPU and Memory utilization.
 */
async function getECSMetrics() {
  const metrics = [
    {
      id: 'ecsCpu',

      namespace: 'AWS/ECS',

      metricName: 'CPUUtilization',

      dimensions: [
        {
          Name: 'ClusterName',
          Value: CLUSTER
        },
        {
          Name: 'ServiceName',
          Value: SERVICE
        }
      ],

      stat: 'Average'
    },

    {
      id: 'ecsMemory',

      namespace: 'AWS/ECS',

      metricName: 'MemoryUtilization',

      dimensions: [
        {
          Name: 'ClusterName',
          Value: CLUSTER
        },
        {
          Name: 'ServiceName',
          Value: SERVICE
        }
      ],

      stat: 'Average'
    }
  ];

  const results =
    await getMetricData(metrics);

  const cpu =
    results.find(
      item => item.Id === 'ecsCpu'
    );

  const memory =
    results.find(
      item => item.Id === 'ecsMemory'
    );

  return {
    cpuUtilization: {
      value:
        cpu?.Values?.length
          ? cpu.Values[
              cpu.Values.length - 1
            ]
          : null,

      unit: 'Percent',

      timestamp:
        cpu?.Timestamps?.length
          ? cpu.Timestamps[
              cpu.Timestamps.length - 1
            ]
          : null
    },

    memoryUtilization: {
      value:
        memory?.Values?.length
          ? memory.Values[
              memory.Values.length - 1
            ]
          : null,

      unit: 'Percent',

      timestamp:
        memory?.Timestamps?.length
          ? memory.Timestamps[
              memory.Timestamps.length - 1
            ]
          : null
    }
  };
}

/**
 * Get ALB metrics.
 */
async function getALBMetrics(albService) {
  const [
    loadBalancer,
    targetGroup
  ] = await Promise.all([
    albService.getLoadBalancerStatus(),
    albService.getTargetGroupStatus()
  ]);

  const loadBalancerDimension =
    getLoadBalancerDimension(
      loadBalancer.arn
    );

  const targetGroupDimension =
    getTargetGroupDimension(
      targetGroup.arn
    );

  if (
    !loadBalancerDimension ||
    !targetGroupDimension
  ) {
    throw new Error(
      'Unable to determine CloudWatch ALB dimensions.'
    );
  }

  const metrics = [
    {
      id: 'requestCount',

      namespace: 'AWS/ApplicationELB',

      metricName: 'RequestCount',

      dimensions: [
        {
          Name: 'LoadBalancer',
          Value: loadBalancerDimension
        },
        {
          Name: 'TargetGroup',
          Value: targetGroupDimension
        }
      ],

      stat: 'Sum'
    },

    {
      id: 'responseTime',

      namespace: 'AWS/ApplicationELB',

      metricName: 'TargetResponseTime',

      dimensions: [
        {
          Name: 'LoadBalancer',
          Value: loadBalancerDimension
        },
        {
          Name: 'TargetGroup',
          Value: targetGroupDimension
        }
      ],

      stat: 'Average'
    },

    {
      id: 'http5xx',

      namespace: 'AWS/ApplicationELB',

      metricName: 'HTTPCode_Target_5XX_Count',

      dimensions: [
        {
          Name: 'LoadBalancer',
          Value: loadBalancerDimension
        },
        {
          Name: 'TargetGroup',
          Value: targetGroupDimension
        }
      ],

      stat: 'Sum'
    }
  ];

  const results =
    await getMetricData(metrics);

  const requestCount =
    results.find(
      item => item.Id === 'requestCount'
    );

  const responseTime =
    results.find(
      item => item.Id === 'responseTime'
    );

  const http5xx =
    results.find(
      item => item.Id === 'http5xx'
    );

  return {
    requestCount: {
      value:
        requestCount?.Values?.length
          ? requestCount.Values[
              requestCount.Values.length - 1
            ]
          : 0,

      unit: 'Count',

      timestamp:
        requestCount?.Timestamps?.length
          ? requestCount.Timestamps[
              requestCount.Timestamps.length - 1
            ]
          : null
    },

    targetResponseTime: {
      value:
        responseTime?.Values?.length
          ? responseTime.Values[
              responseTime.Values.length - 1
            ]
          : null,

      unit: 'Seconds',

      timestamp:
        responseTime?.Timestamps?.length
          ? responseTime.Timestamps[
              responseTime.Timestamps.length - 1
            ]
          : null
    },

    http5xx: {
      value:
        http5xx?.Values?.length
          ? http5xx.Values[
              http5xx.Values.length - 1
            ]
          : 0,

      unit: 'Count',

      timestamp:
        http5xx?.Timestamps?.length
          ? http5xx.Timestamps[
              http5xx.Timestamps.length - 1
            ]
          : null
    }
  };
}

/**
 * Get complete CloudWatch monitoring status.
 */
async function getMonitoringStatus(albService) {
  const [
    ecs,
    alb
  ] = await Promise.all([
    getECSMetrics(),
    getALBMetrics(albService)
  ]);

  return {
    region: REGION,

    ecs: {
      cluster: CLUSTER,
      service: SERVICE,
      ...ecs
    },

    alb,

    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getECSMetrics,
  getALBMetrics,
  getMonitoringStatus
};