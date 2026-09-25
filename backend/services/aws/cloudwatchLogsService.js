const {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand
} = require('@aws-sdk/client-cloudwatch-logs');

const REGION =
  process.env.AWS_REGION || 'ap-south-1';

const LOG_GROUP =
  process.env.AWS_LOG_GROUP ||
  '/ecs/intelligent-cloud-demo-app';

const cloudWatchLogsClient =
  new CloudWatchLogsClient({
    region: REGION
  });

/**
 * Get the latest ECS CloudWatch log stream.
 */
async function getLatestLogStream() {
  const command =
    new DescribeLogStreamsCommand({
      logGroupName: LOG_GROUP,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 1
    });

  const response =
    await cloudWatchLogsClient.send(command);

  return response.logStreams?.[0] || null;
}

/**
 * Get the latest ECS container logs.
 */
async function getLogs(limit = 100) {
  const stream =
    await getLatestLogStream();

  if (!stream?.logStreamName) {
    return {
      region: REGION,
      logGroup: LOG_GROUP,
      logStream: null,
      events: []
    };
  }

  const command =
    new GetLogEventsCommand({
      logGroupName: LOG_GROUP,
      logStreamName: stream.logStreamName,
      startFromHead: false,
      limit
    });

  const response =
    await cloudWatchLogsClient.send(command);

  const events =
    (response.events || []).map(event => ({
      timestamp: event.timestamp,
      message: event.message
    }));

  return {
    region: REGION,
    logGroup: LOG_GROUP,
    logStream: stream.logStreamName,
    events
  };
}

module.exports = {
  getLatestLogStream,
  getLogs
};