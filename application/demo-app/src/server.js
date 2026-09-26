const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

app.use(express.json());

// Application identification header
app.use((req, res, next) => {
  res.setHeader("X-Application", "intelligent-cloud-demo-app");
  next();
});

app.get("/", (req, res) => {
  res.json({
    application: "Demo Application",
    message: "Application deployed successfully",
    version: APP_VERSION,
    deploymentTest: "phase-4-verification"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy"
  });
});

app.get("/api/version", (req, res) => {
  res.json({
    version: APP_VERSION
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Demo application running on http://0.0.0.0:${PORT}`
    );
  });
}

module.exports = app;