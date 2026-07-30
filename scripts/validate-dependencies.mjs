#!/usr/bin/env node
/**
 * Validate package-lock.json against package.json dependencies and devDependencies
 * Provides detailed logging to prevent silent build/deployment failures during CI/CD.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packageJsonPath = resolve(repoRoot, "package.json");
const packageLockPath = resolve(repoRoot, "package-lock.json");

console.log("==================================================");
console.log("🔍 [validate-deps] Validating package-lock.json dependencies...");
console.log("==================================================");

if (!existsSync(packageJsonPath)) {
  console.error("❌ [validate-deps] ERROR: package.json not found!");
  process.exit(1);
}

if (!existsSync(packageLockPath)) {
  console.error(
    "❌ [validate-deps] ERROR: package-lock.json is missing! Run 'npm install' to generate it.",
  );
  process.exit(1);
}

let pkgJson, pkgLock;
try {
  pkgJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
} catch (err) {
  console.error("❌ [validate-deps] ERROR: Failed to parse package.json:", err.message);
  process.exit(1);
}

try {
  pkgLock = JSON.parse(readFileSync(packageLockPath, "utf8"));
} catch (err) {
  console.error("❌ [validate-deps] ERROR: Failed to parse package-lock.json:", err.message);
  process.exit(1);
}

const requiredDeps = {
  ...(pkgJson.dependencies || {}),
  ...(pkgJson.devDependencies || {}),
};

const missingDeps = [];
const verifiedDeps = [];

const lockPackages = pkgLock.packages || {};
const lockDependencies = pkgLock.dependencies || {};

for (const [pkgName, reqVersion] of Object.entries(requiredDeps)) {
  const nodeModuleKey = `node_modules/${pkgName}`;
  const lockPkg = lockPackages[nodeModuleKey];
  const legacyLockPkg = lockDependencies[pkgName];

  const lockedVersion = lockPkg?.version || legacyLockPkg?.version;

  if (lockedVersion) {
    verifiedDeps.push({ name: pkgName, reqVersion, lockedVersion });
  } else {
    missingDeps.push({ name: pkgName, reqVersion });
  }
}

console.log(`\n📦 Checked ${Object.keys(requiredDeps).length} required dependencies.`);
console.log(`✅ ${verifiedDeps.length} dependencies verified in package-lock.json.`);

if (missingDeps.length > 0) {
  console.error(`\n❌ ERROR: Found ${missingDeps.length} missing package(s) in package-lock.json:`);
  for (const item of missingDeps) {
    console.error(`  - ${item.name} (required: ${item.reqVersion})`);
  }
  console.error("\n💡 To fix this, synchronize package-lock.json by running:\n    npm install\n");
  process.exit(1);
}

console.log(
  "✨ [validate-deps] All dependencies successfully synchronized in package-lock.json!\n",
);
