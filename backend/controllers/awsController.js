const ecsService = require('../services/aws/ecsService');
const albService = require('../services/aws/albService');
const cloudwatchService = require('../services/aws/cloudwatchService');
const cloudwatchLogsService = require('../services/aws/cloudwatchLogsService');

/**
 * Get ECS deployment status.
 */
exports.getECSStatus = async (req, res, next) => {
  try {
    const data =
      await ecsService.getDeploymentStatus();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ALB and Target Group status.
 */
exports.getALBStatus = async (req, res, next) => {
  try {
    const data =
      await albService.getALBStatus();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get real AWS CloudWatch monitoring data.
 */
exports.getCloudWatchMetrics = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await cloudwatchService.getMonitoringStatus(
        albService
      );

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getCloudWatchLogs = async (req, res, next) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || 100,
      500
    );

    const data = await cloudwatchLogsService.getLogs(limit);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};