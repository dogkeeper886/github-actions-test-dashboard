const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initDatabase } = require("./database/connection");
const { runMigrations } = require("./database/migrations");
const DataCollectorService = require("./services/dataCollector");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/workflows", require("./routes/workflows"));
app.use("/api/runs", require("./routes/runs"));
app.use("/api/tests", require("./routes/tests"));
app.use("/api/refresh", require("./routes/refresh"));
app.use("/api/files", require("./routes/files"));

async function startServer() {
  await initDatabase();
  await runMigrations();

  const dataCollector = new DataCollectorService();
  dataCollector.start();

  app.locals.dataCollector = dataCollector;

  app.listen(PORT);
}

process.on("SIGTERM", () => {
  if (app.locals.dataCollector) {
    app.locals.dataCollector.stop();
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  if (app.locals.dataCollector) {
    app.locals.dataCollector.stop();
  }
  process.exit(0);
});

startServer();

module.exports = app;
