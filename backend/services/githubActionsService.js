const GITHUB_API_URL =
  'https://api.github.com';

const GITHUB_OWNER =
  process.env.GITHUB_OWNER;

const GITHUB_REPO =
  process.env.GITHUB_REPO;

const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN;


/*
 * Validate GitHub configuration.
 */
function validateConfig() {
  if (!GITHUB_OWNER) {
    throw new Error(
      'GITHUB_OWNER is not configured.'
    );
  }

  if (!GITHUB_REPO) {
    throw new Error(
      'GITHUB_REPO is not configured.'
    );
  }

  if (!GITHUB_TOKEN) {
    throw new Error(
      'GITHUB_TOKEN is not configured.'
    );
  }
}


/*
 * Common GitHub API request helper.
 */
async function githubRequest(
  endpoint,
  options = {}
) {
  validateConfig();

  const response = await fetch(
    `${GITHUB_API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        Accept:
          'application/vnd.github+json',

        Authorization:
          `Bearer ${GITHUB_TOKEN}`,

        'X-GitHub-Api-Version':
          '2022-11-28',

        ...options.headers
      }
    }
  );

  const text =
    await response.text();

  let data;

  try {
    data =
      text
        ? JSON.parse(text)
        : {};
  } catch {
    data = {
      message: text
    };
  }

  if (!response.ok) {
    throw new Error(
      `GitHub API ${response.status}: ${
        data.message ||
        'Request failed'
      }`
    );
  }

  return data;
}


/*
 * Get latest GitHub Actions workflow runs.
 *
 * Existing callers can continue using:
 *
 * getWorkflowRuns(10)
 *
 * Optional filters can also be supplied:
 *
 * getWorkflowRuns(10, {
 *   workflowId,
 *   branch,
 *   event
 * })
 */
async function getWorkflowRuns(
  limit = 10,
  options = {}
) {
  const {
    workflowId,
    branch,
    event
  } = options;

  const query =
    new URLSearchParams();

  query.set(
    'per_page',
    String(Math.min(limit, 100))
  );

  if (branch) {
    query.set(
      'branch',
      branch
    );
  }

  if (event) {
    query.set(
      'event',
      event
    );
  }

  let endpoint;

  if (workflowId) {
    endpoint =
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}` +
      `/actions/workflows/${encodeURIComponent(
        workflowId
      )}/runs?${query.toString()}`;
  } else {
    endpoint =
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}` +
      `/actions/runs?${query.toString()}`;
  }

  const data =
    await githubRequest(endpoint);

  return {
    totalCount:
      data.total_count || 0,

    runs:
      (data.workflow_runs || [])
        .map(run => ({
          id: run.id,

          name: run.name,

          workflowName:
            run.name,

          workflowId:
            run.workflow_id,

          status:
            run.status,

          conclusion:
            run.conclusion,

          branch:
            run.head_branch,

          commitSha:
            run.head_sha,

          commitMessage:
            run.head_commit?.message ||
            '',

          event:
            run.event,

          htmlUrl:
            run.html_url,

          createdAt:
            run.created_at,

          updatedAt:
            run.updated_at,

          runNumber:
            run.run_number
        }))
  };
}


/*
 * Find the exact GitHub Actions run created
 * by the workflow dispatch request.
 *
 * GitHub workflow_dispatch normally returns
 * HTTP 204 without returning the run ID.
 *
 * Therefore we:
 *
 * 1. Query the exact workflow.
 * 2. Filter by exact branch.
 * 3. Filter by workflow_dispatch event.
 * 4. Only accept runs created after the
 *    dispatch request started.
 */
async function findTriggeredWorkflowRun({
  workflowId,
  branch = 'main',
  triggeredAt,
  timeoutMs = 30000,
  pollIntervalMs = 2000
} = {}) {
  if (!workflowId) {
    throw new Error(
      'workflowId is required to find the triggered workflow run.'
    );
  }

  const triggerTime =
    triggeredAt
      ? new Date(triggeredAt).getTime()
      : Date.now();

  const deadline =
    Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const result =
        await getWorkflowRuns(
          20,
          {
            workflowId,
            branch,
            event: 'workflow_dispatch'
          }
        );

      const matchingRuns =
        result.runs
          .filter(run => {
            const createdTime =
              new Date(
                run.createdAt
              ).getTime();

            return (
              run.branch === branch &&
              run.event ===
                'workflow_dispatch' &&
              createdTime >=
                triggerTime
            );
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

      if (
        matchingRuns.length > 0
      ) {
        return matchingRuns[0];
      }
    } catch (error) {
      console.warn(
        'Unable to find triggered GitHub Actions run:',
        error.message
      );
    }

    await new Promise(resolve =>
      setTimeout(
        resolve,
        pollIntervalMs
      )
    );
  }

  return null;
}


/*
 * Get one workflow run.
 */
async function getWorkflowRun(
  runId
) {
  return githubRequest(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}` +
    `/actions/runs/${runId}`
  );
}


/*
 * Get jobs belonging to a workflow run.
 */
async function getWorkflowRunJobs(
  runId
) {
  const data =
    await githubRequest(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}` +
      `/actions/runs/${runId}/jobs?per_page=100`
    );

  return {
    jobs:
      (data.jobs || [])
        .map(job => ({
          id: job.id,

          name:
            job.name,

          status:
            job.status,

          conclusion:
            job.conclusion,

          startedAt:
            job.started_at,

          completedAt:
            job.completed_at,

          htmlUrl:
            job.html_url,

          steps:
            (job.steps || [])
              .map(step => ({
                name:
                  step.name,

                status:
                  step.status,

                conclusion:
                  step.conclusion,

                startedAt:
                  step.started_at,

                completedAt:
                  step.completed_at
              }))
        }))
  };
}


/*
 * Get latest deployment pipeline status.
 */
async function getLatestDeploymentStatus() {
  const result =
    await getWorkflowRuns(1);

  const run =
    result.runs[0];

  if (!run) {
    return {
      configured: true,
      hasRun: false,
      status: 'NO_RUN'
    };
  }

  let pipelineStatus =
    'UNKNOWN';

  if (
    run.status ===
    'queued'
  ) {
    pipelineStatus =
      'QUEUED';

  } else if (
    run.status ===
    'in_progress'
  ) {
    pipelineStatus =
      'IN_PROGRESS';

  } else if (
    run.status ===
    'completed'
  ) {
    if (
      run.conclusion ===
      'success'
    ) {
      pipelineStatus =
        'SUCCESS';

    } else if (
      run.conclusion ===
      'failure'
    ) {
      pipelineStatus =
        'FAILED';

    } else if (
      run.conclusion ===
      'cancelled'
    ) {
      pipelineStatus =
        'CANCELLED';

    } else if (
      run.conclusion ===
      'timed_out'
    ) {
      pipelineStatus =
        'TIMED_OUT';

    } else {
      pipelineStatus =
        String(
          run.conclusion ||
          'COMPLETED'
        ).toUpperCase();
    }
  }

  return {
    configured: true,
    hasRun: true,
    status: pipelineStatus,
    run
  };
}


/*
 * Trigger GitHub Actions deployment workflow.
 *
 * The workflow must support:
 *
 * on:
 *   workflow_dispatch:
 */
async function triggerDeploymentWorkflow({
  workflowId,
  branch = 'main'
} = {}) {
  const selectedWorkflow =
    workflowId ||
    process.env.GITHUB_WORKFLOW_ID;

  if (!selectedWorkflow) {
    throw new Error(
      'GITHUB_WORKFLOW_ID is not configured.'
    );
  }

  /*
   * Record the exact moment immediately
   * before sending the dispatch request.
   */
  const triggeredAt =
    new Date().toISOString();

  await githubRequest(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}` +
    `/actions/workflows/${encodeURIComponent(
      selectedWorkflow
    )}/dispatches`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json'
      },

      body: JSON.stringify({
        ref: branch
      })
    }
  );

  return {
    triggered: true,

    workflowId:
      selectedWorkflow,

    branch,

    triggeredAt
  };
}


module.exports = {
  getWorkflowRuns,

  findTriggeredWorkflowRun,

  getWorkflowRun,

  getWorkflowRunJobs,

  getLatestDeploymentStatus,

  triggerDeploymentWorkflow
};