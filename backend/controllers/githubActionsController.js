const githubActionsService =
  require('../services/githubActionsService');

const Deployment =
  require('../models/Deployment');

const Project =
  require('../models/Project');

const db =
  require('../config/database');

exports.getWorkflowRuns = async (
  req,
  res,
  next
) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || 10,
      50
    );

    const data =
      await githubActionsService.getWorkflowRuns(
        limit
      );

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getLatestDeploymentStatus = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await githubActionsService
        .getLatestDeploymentStatus();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkflowRun = async (
  req,
  res,
  next
) => {
  try {
    const { runId } = req.params;

    const data =
      await githubActionsService
        .getWorkflowRun(runId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkflowRunJobs = async (
  req,
  res,
  next
) => {
  try {
    const { runId } = req.params;

    const data =
      await githubActionsService
        .getWorkflowRunJobs(runId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};


/*
 * Trigger real GitHub Actions deployment
 * and create a PostgreSQL deployment record.
 */
exports.triggerDeployment = async (
  req,
  res,
  next
) => {
  try {
    const {
      workflowId,
      branch =
        process.env.GITHUB_BRANCH || 'main',
      project_id = 1,
      environment = 'Production',
      version,
      commit_sha
    } = req.body || {};

    const projectId =
      parseInt(project_id, 10);

    if (Number.isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project_id.'
      });
    }

    if (!environment) {
      return res.status(400).json({
        success: false,
        error: 'Environment is required.'
      });
    }

    // --------------------------------------------------------
    // 1. Prevent duplicate active deployments
    // --------------------------------------------------------

    const activeDeploymentResult =
      await db.query(
        `
        SELECT
          id,
          version,
          status,
          github_run_id,
          github_run_number,
          started_at
        FROM deployments
        WHERE project_id = $1
          AND environment = $2
          AND status IN (
            'QUEUED',
            'BUILDING',
            'DEPLOYING',
            'HEALTH_CHECK'
          )
        ORDER BY started_at DESC
        LIMIT 1
        `,
        [
          projectId,
          environment
        ]
      );

    if (
      activeDeploymentResult.rows.length > 0
    ) {
      const activeDeployment =
        activeDeploymentResult.rows[0];

      return res.status(409).json({
        success: false,
        error:
          'A deployment is already in progress for this project and environment.',
        data: {
          deployment: activeDeployment
        }
      });
    }

    // --------------------------------------------------------
    // 2. Validate project
    // --------------------------------------------------------

    const project =
      await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found.'
      });
    }

    // --------------------------------------------------------
    // 3. Create initial deployment record
    // --------------------------------------------------------

    const deployment =
      await Deployment.create({
        project_id: projectId,

        version:
          version ||
          `v${new Date()
            .toISOString()
            .replace(/[-:TZ.]/g, '')
            .slice(0, 14)}`,

        commit_sha:
          commit_sha || 'pending',

        environment,

        status: 'QUEUED'
      });

    // --------------------------------------------------------
// 4. Trigger GitHub Actions workflow
// --------------------------------------------------------

const triggerResult =
  await githubActionsService
    .triggerDeploymentWorkflow({
      workflowId,
      branch
    });

// --------------------------------------------------------
// 5. Find the exact GitHub Actions run
// --------------------------------------------------------

let githubRun = null;

try {
  githubRun =
    await githubActionsService
      .findTriggeredWorkflowRun({
        workflowId:
          triggerResult.workflowId,

        branch:
          triggerResult.branch,

        triggeredAt:
          triggerResult.triggeredAt,

        timeoutMs: 30000,

        pollIntervalMs: 2000
      });
} catch (
  githubLookupError
) {
  console.warn(
    'Unable to find triggered GitHub Actions run:',
    githubLookupError.message
  );
}

    // --------------------------------------------------------
    // 7. Save GitHub Actions information
    // --------------------------------------------------------

    if (githubRun) {
      const result =
        await db.query(
          `
          UPDATE deployments
          SET
            github_run_id = $1,
            github_run_number = $2,
            github_run_url = $3,
            commit_sha = $4
          WHERE id = $5
          RETURNING *
          `,
          [
            githubRun.id,
            githubRun.runNumber,
            githubRun.htmlUrl,
            githubRun.commitSha ||
              commit_sha ||
              'pending',
            deployment.id
          ]
        );

      const updatedDeployment =
        result.rows[0];

      return res.status(202).json({
        success: true,

        message:
          'GitHub Actions deployment triggered and deployment record created.',

        data: {
          deployment:
            updatedDeployment,

          github: {
            triggered: true,

            workflowId:
              triggerResult.workflowId,

            branch:
              triggerResult.branch,

            runId:
              githubRun.id,

            runNumber:
              githubRun.runNumber,

            url:
              githubRun.htmlUrl
          }
        }
      });
    }

    // --------------------------------------------------------
    // 8. Workflow triggered but run not found immediately
    // --------------------------------------------------------

    return res.status(202).json({
      success: true,

      message:
        'GitHub Actions deployment triggered. The workflow run is being registered.',

      data: {
        deployment,

        github: {
          triggered: true,

          workflowId:
            triggerResult.workflowId,

          branch:
            triggerResult.branch,

          runId: null,

          runNumber: null,

          url: null
        }
      }
    });

  } catch (error) {
    next(error);
  }
};