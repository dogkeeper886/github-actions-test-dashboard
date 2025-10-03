const githubService = require("./github");
const DataRecorderService = require("./dataRecorder");

class WorkflowProcessorService {
  constructor() {
    this.dataRecorder = new DataRecorderService();
  }

  async processAndRecordRun(runId, runData = null) {
    if (!runData) {
      runData = await this.getRunData(runId);
    }

    const jobs = await githubService.getWorkflowRunJobs(runId);
    const artifacts = await githubService.getWorkflowRunArtifacts(runId);
    const processedArtifacts = [];

    for (const artifact of artifacts) {
      if (artifact.expired) continue;

      const processedArtifact = await this.processArtifact(runId, artifact);
      processedArtifacts.push(processedArtifact);
    }

    const recordingResult = await this.dataRecorder.recordCompleteRun(
      runData,
      processedArtifacts,
      jobs,
    );

    return {
      success: true,
      runId,
      ...recordingResult,
    };
  }

  async processArtifact(runId, artifact) {
    const path = require("path");
    const fs = require("fs-extra");

    const downloadPath = path.join("./temp", `${artifact.id}.zip`);
    const extractPath = path.join("./temp", `extracted_${artifact.id}`);

    await githubService.downloadArtifact(artifact.id, downloadPath);
    const extractedFiles = await githubService.extractArtifact(
      downloadPath,
      extractPath,
    );

    const processedFiles = [];
    for (const filePath of extractedFiles) {
      const processedFile = await this.processExtractedFile(
        filePath,
        runId,
        artifact.name,
      );
      if (processedFile) {
        processedFiles.push(processedFile);
      }
    }

    await fs.remove(downloadPath);
    await fs.remove(extractPath);

    return {
      ...artifact,
      extractedFiles: processedFiles,
    };
  }

  async processExtractedFile(filePath, runId, artifactName) {
    const path = require("path");
    const fs = require("fs-extra");
    const crypto = require("crypto");

    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const stats = await fs.stat(filePath);

    const hash = crypto
      .createHash("md5")
      .update(filePath)
      .digest("hex")
      .substring(0, 8);
    const storedFilename = `${runId}_${hash}_${fileName}`;

    const baseFile = {
      originalPath: path.relative("./temp", filePath),
      size: stats.size,
      storedFilename,
      artifactName,
    };

    if (this.isImageFile(ext)) {
      return await this.processImageFile(filePath, runId, baseFile);
    } else if (ext === ".json") {
      return await this.processJsonFile(filePath, baseFile);
    } else if (this.isTextFile(ext)) {
      return await this.processTextFile(filePath, baseFile);
    } else {
      return await this.processBinaryFile(filePath, runId, baseFile);
    }
  }

  async processImageFile(filePath, runId, baseFile) {
    const path = require("path");
    const fs = require("fs-extra");

    const screenshotDir = "./data/screenshots";
    await fs.ensureDir(screenshotDir);

    const storedPath = path.join(screenshotDir, baseFile.storedFilename);
    await fs.copy(filePath, storedPath);

    return {
      ...baseFile,
      type: "image",
      url: `/api/files/${baseFile.storedFilename}`,
    };
  }

  async processJsonFile(filePath, baseFile) {
    const fs = require("fs-extra");

    const content = await fs.readFile(filePath, "utf8");
    const jsonContent = JSON.parse(content);

    return {
      ...baseFile,
      type: "json",
      content: jsonContent,
    };
  }

  async processTextFile(filePath, baseFile) {
    const fs = require("fs-extra");

    const content = await fs.readFile(filePath, "utf8");
    return {
      ...baseFile,
      type: "text",
      content,
    };
  }

  async processBinaryFile(filePath, runId, baseFile) {
    const path = require("path");
    const fs = require("fs-extra");

    const binaryDir = "./data/files";
    await fs.ensureDir(binaryDir);

    const storedPath = path.join(binaryDir, baseFile.storedFilename);
    await fs.copy(filePath, storedPath);

    return {
      ...baseFile,
      type: "binary",
      url: `/api/files/${baseFile.storedFilename}`,
    };
  }

  async getRunData(runId) {
    const { Octokit } = require("@octokit/rest");
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data } = await octokit.rest.actions.getWorkflowRun({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      run_id: runId,
    });

    return data;
  }

  async processMultipleRuns(runs) {
    return Promise.all(
      runs.map(async (run) => {
        return await this.processAndRecordRun(run.id, run);
      }),
    );
  }

  isImageFile(ext) {
    return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(ext);
  }

  isTextFile(ext) {
    return [
      ".txt",
      ".log",
      ".md",
      ".csv",
      ".xml",
      ".html",
      ".css",
      ".js",
      ".ts",
    ].includes(ext);
  }
}

module.exports = WorkflowProcessorService;
