/**
 * Inject build metadata into the final HTML
 * This script runs after the build to add version, commit, and timestamp info
 *
 * Usage:
 *   node scripts/inject-build-metadata.mjs [--output-dir dist/client]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse arguments
const args = process.argv.slice(2);
let outputDir = "dist";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--output-dir" && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  }
}

async function getBuildMetadata() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"));

  let commit = "unknown";
  let branch = "unknown";

  try {
    const { stdout: commitOutput } = await execAsync("git rev-parse HEAD");
    commit = commitOutput.trim();

    const { stdout: branchOutput } = await execAsync("git rev-parse --abbrev-ref HEAD");
    branch = branchOutput.trim();
  } catch (err) {
    console.warn("[v0] Could not get git metadata:", err.message);
  }

  return {
    version: packageJson.version || "0.0.0",
    commit,
    branch,
    timestamp: new Date().toISOString(),
    buildNumber: process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || "local",
  };
}

function createMetadataScript(metadata) {
  return `
(function() {
  window.__BUILD_VERSION__ = "${metadata.version}";
  window.__BUILD_COMMIT__ = "${metadata.commit}";
  window.__BUILD_BRANCH__ = "${metadata.branch}";
  window.__BUILD_TIMESTAMP__ = "${metadata.timestamp}";
  window.__BUILD_NUMBER__ = "${metadata.buildNumber}";
  console.log("[v0] Build Info: v" + window.__BUILD_VERSION__ + " (" + window.__BUILD_COMMIT__.slice(0, 7) + ") - " + window.__BUILD_TIMESTAMP__);
})();
  `.trim();
}

async function injectMetadata() {
  try {
    console.log(`[v0] Injecting build metadata...`);
    console.log(`[v0] Output directory: ${outputDir}`);

    // Get build metadata
    const metadata = await getBuildMetadata();
    console.log(`[v0] Version: v${metadata.version}`);
    console.log(`[v0] Commit: ${metadata.commit.slice(0, 12)}`);
    console.log(`[v0] Branch: ${metadata.branch}`);
    console.log(`[v0] Timestamp: ${metadata.timestamp}`);

    // Find index.html
    const indexPath = path.join(outputDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`[v0] ERROR: index.html not found at ${indexPath}`);
      process.exit(1);
    }

    // Read index.html
    let html = fs.readFileSync(indexPath, "utf-8");

    // Create metadata script
    const metadataScript = createMetadataScript(metadata);

    // Inject into head before other scripts
    const headEnd = html.indexOf("</head>");
    if (headEnd === -1) {
      console.error("[v0] ERROR: Could not find </head> tag in index.html");
      process.exit(1);
    }

    const injectionPoint = headEnd;
    const updatedHtml =
      html.slice(0, injectionPoint) +
      `\n  <script>${metadataScript}</script>\n  ` +
      html.slice(injectionPoint);

    // Write back
    fs.writeFileSync(indexPath, updatedHtml, "utf-8");

    console.log(`[v0] ✓ Build metadata injected successfully`);

    // Also create a metadata.json file for reference
    const metadataPath = path.join(outputDir, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
    console.log(`[v0] ✓ Metadata JSON created at ${metadataPath}`);
  } catch (err) {
    console.error("[v0] ERROR:", err.message);
    process.exit(1);
  }
}

// Run
injectMetadata().catch((err) => {
  console.error("[v0] Fatal error:", err);
  process.exit(1);
});
