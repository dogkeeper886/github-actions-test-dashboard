function parseJobLogsIntoSteps(logText, steps) {
  const stripAnsi = (text) => text.replace(/\x1B\[[0-9;]*m/gi, "");
  const cleanedLogText = stripAnsi(logText);
  const lines = cleanedLogText.split("\n");

  // Find lines that mark the start of each step's log section
  const stepBoundaries = [];
  let isFirstGroup = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Step boundaries are marked by:
    // 1. The first ##[group] in the entire log (Set up job)
    // 2. Any ##[group]Run ... (actual step commands/actions)
    if (line.includes("##[group]")) {
      if (isFirstGroup || line.includes("##[group]Run ")) {
        stepBoundaries.push(i);
        isFirstGroup = false;
      }
    }
  }

  // Extract sections between step boundaries
  const sections = [];
  for (let i = 0; i < stepBoundaries.length; i++) {
    const start = stepBoundaries[i];
    const end = stepBoundaries[i + 1] || lines.length;
    sections.push(lines.slice(start, end).join("\n"));
  }

  // Match sections to steps in order
  return steps.map((step, idx) => ({
    ...step,
    log_content: sections[idx] || "",
  }));
}

module.exports = { parseJobLogsIntoSteps };
