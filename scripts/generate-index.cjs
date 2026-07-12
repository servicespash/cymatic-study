const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const distClientPath = path.join(__dirname, "../dist/client");
const assetsPath = path.join(distClientPath, "assets");

try {
  // Ensure dist/client directory exists
  if (!fs.existsSync(distClientPath)) {
    fs.mkdirSync(distClientPath, { recursive: true });
  }

  // Find the largest JS bundle
  const jsFiles = fs
    .readdirSync(assetsPath)
    .filter((f) => f.startsWith("index-") && f.endsWith(".js"));
  if (jsFiles.length === 0) {
    throw new Error("No JS bundle found in dist/client/assets");
  }

  // Sort by size (descending) to get the largest one, assuming it's the main bundle
  const largestJsFile = jsFiles.sort((a, b) => {
    const statA = fs.statSync(path.join(assetsPath, a));
    const statB = fs.statSync(path.join(assetsPath, b));
    return statB.size - statA.size;
  })[0];

  // Find the CSS bundle (assuming one main CSS file)
  const cssFiles = fs
    .readdirSync(assetsPath)
    .filter((f) => f.startsWith("styles-") && f.endsWith(".css"));
  const cssFile = cssFiles.length > 0 ? cssFiles[0] : ""; // Might not always have a main CSS

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Cymatic Hub</title>
    ${cssFile ? `<link rel='stylesheet' href='assets/${cssFile}'>` : ""}
</head>
<body>
    <div id='root'></div>
    <script type='module' src='assets/${largestJsFile}'></script>
</body>
</html>`;

  fs.writeFileSync(path.join(distClientPath, "index.html"), htmlContent);
  console.log("Successfully generated dist/client/index.html");
} catch (error) {
  console.error("Error generating index.html:", error);
  process.exit(1);
}
