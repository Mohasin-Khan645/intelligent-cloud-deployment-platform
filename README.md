# Intelligent Cloud Application Deployment and CI/CD Platform
### Phase 1 — Local Application Build

A modern DevOps and continuous deployment web application platform built with **React (Vite)**, **Node.js (Express)**, and **PostgreSQL**.

> **Note**: This is Phase 1 (Local Foundation). No AWS infrastructure, Terraform, Docker ECS/ECR, or GitHub Actions pipelines are deployed at this stage. All deployment lifecycle stages, log streaming, and telemetry metrics are fully functional locally with realistic simulation.

---

## 1. Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                    │
│             (Port 5173 - Modern Dark DevOps UI)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JWT / REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js + Express Backend                 │
│               (Port 5000 - Modular Control Plane)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL Queries (pg Pool)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                    │
│             (Port 5432 - users, projects, etc.)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Standalone Demo Microservice              │
│               (Port 3000 - Target Container App)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Project Directory Structure

```text
intelligent-cloud-deployment-platform/
│
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── database/
│   └── schema.sql                  # PostgreSQL tables & seed data
│
├── backend/
│   ├── package.json
│   ├── server.js                   # Express server entry (:5000)
│   ├── config/
│   │   └── database.js             # PostgreSQL connection pool & resilient fallback
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, Me (JWT + bcrypt)
│   │   ├── projectController.js    # Projects CRUD & KPI Dashboard statistics
│   │   ├── deploymentController.js # Deployment lifecycle simulation & monitoring
│   │   └── environmentController.js# Environment status & version management
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── deploymentRoutes.js
│   │   └── environmentRoutes.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Deployment.js
│   │   └── Environment.js
│   ├── middleware/
│   │   ├── auth.js                 # JWT Bearer token validator
│   │   └── errorHandler.js         # 404 & structured error handler
│   ├── scripts/
│   │   └── init-db.js              # Database initialization & seed runner
│   ├── tests/
│   │   └── api.test.js             # Automated Jest + Supertest suites
│   └── utils/
│       └── logger.js               # Structured console logger
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js              # Vite bundler & backend proxy (:5173 -> :5000)
│   ├── index.html
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx          # App header, user profile, logout
│       │   ├── Sidebar.jsx         # Modern DevOps navigation
│       │   ├── DashboardCard.jsx   # Metrics KPI card
│       │   ├── ProjectCard.jsx     # Repository card with quick deploy
│       │   ├── DeploymentCard.jsx  # Compact deployment summary
│       │   ├── StatusBadge.jsx     # Glowing status badges
│       │   ├── EnvironmentCard.jsx # Target ring health card
│       │   ├── DeploymentTimeline.jsx # 8-Stage CI/CD pipeline visualizer
│       │   └── LoadingSpinner.jsx  # Spinner & empty state indicators
│       ├── pages/
│       │   ├── Login.jsx           # Dark theme authentication
│       │   ├── Register.jsx        # Account creation
│       │   ├── Dashboard.jsx       # Platform KPIs & recent rollouts
│       │   ├── Projects.jsx        # Project grid & creation modal
│       │   ├── ProjectDetails.jsx  # Configuration & deployment launcher
│       │   ├── Deployments.jsx     # Deployment history table
│       │   ├── DeploymentDetails.jsx# Detailed pipeline view & live stream
│       │   ├── Environments.jsx    # Dev / Staging / Prod rings
│       │   ├── Logs.jsx            # Terminal-style deployment log viewer
│       │   ├── Monitoring.jsx      # Telemetry & CloudWatch-ready metrics
│       │   └── Settings.jsx        # Profiles & deployment defaults
│       ├── services/
│       │   └── api.js              # Axios instance with JWT interceptors
│       ├── context/
│       │   └── AuthContext.jsx     # React context managing session
│       ├── App.jsx                 # Client router with route protection
│       ├── main.jsx
│       └── index.css               # Modern DevOps Dark theme
│
└── application/
    └── demo-app/
        ├── package.json
        ├── README.md
        ├── src/
        │   └── server.js           # Lightweight microservice (:3000)
        └── tests/
            └── health.test.js      # Endpoint health verification
```

---

## 3. Prerequisites

- **Node.js**: v18.0.0 or higher (v22+ verified)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Local PostgreSQL 14+ **OR** Docker Desktop (for `docker compose up -d`)

---

## 4. PostgreSQL Database Setup

### Option A: Using Docker (Recommended & Easiest)
From the project root:
```bash
docker compose up -d postgres
```
This automatically boots PostgreSQL on port `5432` and loads `database/schema.sql`.

### Option B: Using Local PostgreSQL Installation
1. Start your PostgreSQL service.
2. Create the database:
```sql
CREATE DATABASE deployment_platform;
```
3. Initialize the schema:
```bash
cd backend
npm run db:init
```

> **Built-in Resilience**: If PostgreSQL is temporarily offline during testing, the backend will log a warning and automatically fall back to an in-memory database store so development and testing can continue seamlessly without crashing.

---

## 5. Starting the Platform

### Step 1: Install Backend Dependencies & Start
Open a terminal:
```bash
cd backend
npm install
npm run dev
```
Backend will start on: **`http://localhost:5000`**
Healthcheck: **`http://localhost:5000/api/health`**

### Step 2: Install Frontend Dependencies & Start
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will open on: **`http://localhost:5173`**

### Step 3: Run the Independent Demo Application
Open a third terminal:
```bash
cd application/demo-app
npm install
npm start
```
Demo application will start on: **`http://localhost:3000`**

---

## 6. Default Login Credentials

A demo DevOps administrator account is pre-seeded in the database:

- **Email**: `admin@clouddeploy.local`
- **Password**: `Password123!`

You can also click **"Register here"** on the login screen to register your own account.

---

## 7. Verifying Features & User Workflow

Once logged in, verify the complete Phase 1 workflow:

1. **Dashboard (`/`)**:
   - View KPI metric cards: Total Projects, Total Deployments, Successful, Failed, Active Environments.
   - Inspect recent deployment status feed.
2. **Projects (`/projects`)**:
   - View existing microservice cards.
   - Click **"+ New Project"** to add a new project with repository and branch details.
   - Click **"Deploy"** on any project to launch a simulated deployment.
3. **Project Details (`/projects/:id`)**:
   - View repository, branch, environment mappings, and deployment history.
4. **Deployments (`/deployments`)**:
   - View complete deployment ledger table with version tags, commit SHAs, environments, and color-coded status badges (`SUCCESS`=green, `FAILED`=red, `BUILDING`=amber, `DEPLOYING`=cyan, `ROLLED_BACK`=orange).
5. **Deployment Details (`/deployments/:id`)**:
   - View the **8-Stage Deployment Timeline**:
     `Source Checkout` → `Install Dependencies` → `Run Tests` → `Build Application` → `Docker Build` → `Push Image` → `Deploy` → `Health Check`.
   - Watch real-time transition if a new deployment was just launched.
   - Read simulated console logs in the dark terminal viewer.
6. **Environments (`/environments`)**:
   - Inspect status of `Development`, `Staging`, and `Production` targets.
7. **Logs Viewer (`/logs`)**:
   - Select any deployment from the dropdown.
   - Filter logs by severity (`INFO`, `WARN`, `ERROR`, `SUCCESS`).
   - Copy or export the logs.
8. **Monitoring Telemetry (`/monitoring`)**:
   - View real-time simulated CPU and memory consumption.
   - Notice the architectural section prepared for **AWS CloudWatch** integration in Phase 2.
9. **Demo Microservice (`http://localhost:3000`)**:
   - Check `GET /` -> Application status
   - Check `GET /health` -> `{"status": "healthy"}`
   - Check `GET /api/version` -> `{"version": "1.0.0"}`

---

## 8. Automated Testing

### Backend Automated Test Suite
```bash
cd backend
npm test
```
Tests:
- `GET /api/health` returns status `200`
- `POST /api/auth/register` validates input, hashes password, returns JWT
- `POST /api/auth/login` checks credentials and returns session token
- `GET /api/projects` verifies authentication enforcement and returns projects

### Demo Microservice Automated Tests
```bash
cd application/demo-app
npm test
```
Tests:
- `GET /health` returns status `200` and `{"status": "healthy"}`
- `GET /` returns deployment payload
- `GET /api/version` returns semantic version

---

## 9. Common Errors and Troubleshooting

| Issue | Cause | Resolution |
|---|---|---|
| **Port 5000 or 5173 already in use** | Another process is bound to the port. | Terminate the occupying process or set `PORT=5001` in `backend/.env`. |
| **PostgreSQL connection refused (`ECONNREFUSED 5432`)** | PostgreSQL service is not running locally. | Start local PostgreSQL, or run `docker compose up -d postgres`. The backend will gracefully use the in-memory store so you can still test everything! |
| **Token expired / 401 Unauthorized** | JWT session has expired or secret was changed. | Click **Logout** in top right and log back in with `admin@clouddeploy.local`. |
| **CORS errors in browser console** | Backend is not accepting requests from origin. | Backend already includes `cors()` middleware. Ensure frontend is connecting to `http://localhost:5000` via proxy. |

---

## 10. Phase 2 Readiness

Phase 1 establishes a modular, decoupling layer between presentation, application logic, and storage. The code is structured for direct enhancement in Phase 2:
- **Dockerization**: `application/demo-app/` has clean, standalone entrypoints ready for `Dockerfile`.
- **AWS ECS / ECR**: Deployments controller has a pluggable pipeline execution interface ready to invoke AWS SDK for ECS task definitions and ECR pushes.
- **AWS CloudWatch**: Monitoring controller is partitioned to integrate AWS CloudWatch client SDK metrics and logs streams.

