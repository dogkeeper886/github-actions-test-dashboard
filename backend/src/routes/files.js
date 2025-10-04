const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const router = express.Router();

router.get("/:filename", async (req, res) => {
  const filename = req.params.filename;

  // Check files directory first (for binary files like zip)
  let filePath = path.join(__dirname, "../../data/files", filename);
  if (await fs.pathExists(filePath)) {
    return res.sendFile(filePath);
  }

  // Then check screenshots directory (for images)
  filePath = path.join(__dirname, "../../data/screenshots", filename);
  if (await fs.pathExists(filePath)) {
    return res.sendFile(filePath);
  }

  res.status(404).json({ error: "File not found" });
});

module.exports = router;
