#!/usr/bin/env node
/**
 * Build-time manifest check.
 * Fails the build if any file listed in scripts/.zip-manifest.txt
 * is missing from the repository.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const manifestPath = resolve(__dirname, ".zip-manifest.txt");

if (!existsSync(manifestPath)) {
  console.warn(`[verify-manifest] No manifest at ${manifestPath} — skipping.`);
  process.exit(0);
}

// Files in the source zip that we don't expect to live in the repo
// (generated, scaffolding, or intentionally replaced by Lovable tooling).
const IGNORE = new Set([
  "bun.lockb",
  "package-lock.json",
  "yarn.lock",
  ".gitignore",
  ".env",
  "README.md",
  "LICENSE",
  "cymatic-master.jks",
  "electron-main.cjs",
  "gradle.properties",
  "skills-lock.json",
]);
// Platform-specific or non-web build artifacts that don't ship with the Lovable web build.
const IGNORE_PREFIXES = [
  ".github/",
  ".vscode/",
  ".agents/",
  ".lovable/",
  "android/",
  "ios/",
  "dist-electron/",
  "assets/",
];
// Skip standalone planning docs at the repo root.
const IGNORE_SUFFIXES = [".md"];

const entries = readFileSync(manifestPath, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .filter(
    (p) =>
      !IGNORE.has(p) &&
      !IGNORE_PREFIXES.some((pre) => p.startsWith(pre)) &&
      !(IGNORE_SUFFIXES.some((s) => p.endsWith(s)) && !p.includes("/")),
  );

const missing = entries.filter((rel) => !existsSync(resolve(repoRoot, rel)));

if (missing.length > 0) {
  console.error(
    `\n[verify-manifest] Build failed — ${missing.length} file(s) from the source zip are missing:\n`,
  );
  for (const m of missing) console.error(`  - ${m}`);
  console.error(
    `\nRestore them from the original archive, or remove the entries from scripts/.zip-manifest.txt if they were intentionally deleted.\n`,
  );
  process.exit(1);
}

console.log(`[verify-manifest] OK — all ${entries.length} manifest files present.`);
