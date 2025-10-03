function parseJobLogsIntoSteps(logText, steps) {
  // Strip ANSI color codes from log text (matches ESC character: \x1B or \x1b)
  const stripAnsi = (text) => text.replace(/\x1B\[[0-9;]*m/gi, "");
  const cleanedLogText = stripAnsi(logText);

  const lines = cleanedLogText.split("\n");

  // Extract all "Run" command sections
  const runSections = [];
  let inRunGroup = false;
  let currentSection = [];
  let groupDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a "Run" command group start
    if (line.includes("##[group]Run ")) {
      inRunGroup = true;
      groupDepth = 1;
      currentSection = [line];
    } else if (inRunGroup) {
      currentSection.push(line);

      // Track nested groups within the Run section
      if (line.includes("##[group]")) {
        groupDepth++;
      } else if (line.includes("##[endgroup]")) {
        groupDepth--;

        if (groupDepth === 0) {
          // End of this Run section
          runSections.push(currentSection.join("\n"));
          currentSection = [];
          inRunGroup = false;
        }
      }
    }
  }

  // Also extract special sections (Set up job, Complete job, etc.)
  const specialSections = {};

  // Find "GITHUB_TOKEN Permissions" section for "Set up job"
  let setupSection = [];
  let inSetup = false;
  let setupDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("##[group]GITHUB_TOKEN Permissions")) {
      inSetup = true;
      setupDepth = 1;
      setupSection = [line];
    } else if (inSetup) {
      setupSection.push(line);

      if (line.includes("##[group]")) {
        setupDepth++;
      } else if (line.includes("##[endgroup]")) {
        setupDepth--;

        if (setupDepth === 0) {
          specialSections["Set up job"] = setupSection.join("\n");
          inSetup = false;
          break;
        }
      }
    }
  }

  // Match sections to steps
  const stepLogs = steps.map((step) => {
    let logContent = "";

    // Check if this is a special step
    if (specialSections[step.name]) {
      logContent = specialSections[step.name];
    } else if (
      step.name.startsWith("Run ") ||
      step.name.includes("Install") ||
      step.name.includes("Cache") ||
      step.name.includes("Checkout") ||
      step.name.includes("Upload")
    ) {
      // This is a "Run" step - find matching section by step order
      const runStepsBefore = steps.filter(
        (s, idx) =>
          idx < steps.indexOf(step) &&
          (s.name.startsWith("Run ") ||
            s.name.includes("Install") ||
            s.name.includes("Cache") ||
            s.name.includes("Checkout") ||
            s.name.includes("Upload")),
      ).length;

      if (runSections[runStepsBefore]) {
        logContent = runSections[runStepsBefore];
      }
    }
    // Post steps and Complete job typically don't have dedicated log sections

    return {
      ...step,
      log_content: logContent,
    };
  });

  return stepLogs;
}

module.exports = { parseJobLogsIntoSteps };
