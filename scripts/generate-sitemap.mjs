import fs from "node:fs";
import path from "node:path";

// This is a simple parser based on routeTree.gen.ts structure
// In a more complex app, we'd use a real router parser.
const routeTreeContent = fs.readFileSync("src/routeTree.gen.ts", "utf-8");

// Extract paths from FileRoutesByFullPath interface
const pathRegex = /'(.*?)':/g;
const paths = new Set();
let match;
while ((match = pathRegex.exec(routeTreeContent)) !== null) {
  const p = match[1];
  // Filter out dynamic routes, APIs, and admin routes if desired
  if (p.includes("$") || p.startsWith("/api") || p.startsWith("/admin") || p.startsWith("/mark"))
    continue;
  paths.add(p);
}

const baseUrl = "https://study.cymatichub.xyz";
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(paths)
  .map(
    (p) => `  <url>
    <loc>${baseUrl}${p === "/" ? "" : p}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join("\n")}
</urlset>`;

fs.writeFileSync("public/sitemap.xml", sitemap);
console.log("[sitemap] Sitemap generated successfully.");
