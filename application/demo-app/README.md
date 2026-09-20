# Demo Application Microservice

A standalone lightweight Node.js Express microservice that acts as the target deployable application for the Intelligent Cloud Deployment Platform.

In future phases, this application will be built as a Docker container image, pushed to AWS ECR, and orchestrated on AWS ECS.

## Endpoints

- `GET /`: Returns application name, status message, and version.
- `GET /health`: Healthcheck probe endpoint returning HTTP 200 `{"status": "healthy"}`.
- `GET /api/version`: Semantic version probe returning `{"version": "1.0.0"}`.

## Running Locally

```bash
cd application/demo-app
npm install
npm start
```

Default port is `3000` (or configured via `PORT` environment variable).

## Running Tests

```bash
npm test
```

