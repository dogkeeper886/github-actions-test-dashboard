const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs-extra");
const ExtractedFile = require("../models/ExtractedFile");

// Serve files by filename or ID
router.get("/files/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Try to find by database ID first
    const file = await ExtractedFile.findById(fileId);

    if (file) {
      // For files with content stored in database (JSON, text)
      if (
        file.content &&
        (file.file_type === "json" || file.file_type === "text")
      ) {
        res.setHeader(
          "Content-Type",
          file.file_type === "json" ? "application/json" : "text/plain",
        );
        return res.send(file.content);
      }

      // For files stored on disk (images, binary)
      if (file.stored_url) {
        const filePath = file.stored_url.replace("/api/files/", "");
        let fullPath;

        if (file.file_type === "image") {
          fullPath = path.join("./data/screenshots", filePath);
        } else {
          fullPath = path.join("./data/files", filePath);
        }

        if (await fs.pathExists(fullPath)) {
          return res.sendFile(path.resolve(fullPath));
        }
      }
    }

    // If not found by ID, try as direct filename
    // Check files directory first (for binary files like zip)
    let fullPath = path.join("./data/files", fileId);
    if (await fs.pathExists(fullPath)) {
      return res.sendFile(path.resolve(fullPath));
    }

    // Then check screenshots directory (for images)
    fullPath = path.join("./data/screenshots", fileId);
    if (await fs.pathExists(fullPath)) {
      return res.sendFile(path.resolve(fullPath));
    }

    res.status(404).json({ error: "File not found" });
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy: Serve screenshot files by filename
router.get("/screenshots/:filename", (req, res) => {
  const { filename } = req.params;
  const screenshotPath =
    process.env.SCREENSHOT_STORAGE_PATH || "./data/screenshots";
  const filePath = path.join(screenshotPath, filename);

  res.sendFile(path.resolve(filePath));
});

// Get file metadata by ID
router.get("/files/:fileId/info", async (req, res) => {
  try {
    const file = await ExtractedFile.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json({
      id: file.id,
      originalPath: file.original_path,
      fileType: file.file_type,
      fileSize: file.file_size,
      artifactName: file.artifact_name,
      extractedAt: file.extracted_at,
      hasContent: !!file.content,
      hasStoredFile: !!file.stored_url,
    });
  } catch (error) {
    console.error("Error getting file info:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
