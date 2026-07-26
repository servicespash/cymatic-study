import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

function loadWranglerVars(): Record<string, string> {
  const vars: Record<string, string> = {};

  try {
    const jsonPath = path.resolve(process.cwd(), "wrangler.json");
    if (fs.existsSync(jsonPath)) {
      const content = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      if (content.vars) {
        Object.assign(vars, content.vars);
      }
    }
  } catch (error) {
    console.debug("No wrangler.json found or readable:", error);
  }

  try {
    const jsoncPath = path.resolve(process.cwd(), "wrangler.jsonc");
    if (fs.existsSync(jsoncPath)) {
      const raw = fs.readFileSync(jsoncPath, "utf-8");
      const cleaned = raw.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");
      const content = JSON.parse(cleaned);
      if (content.vars) {
        Object.assign(vars, content.vars);
      }
    }
  } catch (error) {
    console.debug("No wrangler.jsonc found or readable:", error);
  }

  try {
    const tomlPath = path.resolve(process.cwd(), "wrangler.toml");
    if (fs.existsSync(tomlPath)) {
      const lines = fs.readFileSync(tomlPath, "utf-8").split("\n");
      let inVars = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("[vars]")) {
          inVars = true;
          continue;
        } else if (trimmed.startsWith("[")) {
          inVars = false;
        }
        if (inVars && trimmed && !trimmed.startsWith("#")) {
          const parts = trimmed.split("=");
          if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join("=").trim();
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.substring(1, value.length - 1);
            }
            vars[key] = value;
          }
        }
      }
    }
  } catch (error) {
    console.debug("No wrangler.toml found or readable:", error);
  }

  return vars;
}

const wranglerVars = loadWranglerVars();
for (const [k, v] of Object.entries(wranglerVars)) {
  if (k.startsWith("VITE_") && !process.env[k]) {
    process.env[k] = v;
  }
}

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "sitemap.xml"],
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "Latty's Cymatic Study",
        short_name: "CymaticHub",
        description: "Uganda Secondary NCDC Curriculum Study Companion",
        theme_color: "#0a1628",
        background_color: "#0a1628",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  base: "/",
  define: {
    "process.env.BUILD_MODE": JSON.stringify("lite"),
  },
  server: {
    watch: {
      ignored: ["**/node_modules/**", "**/.wrangler/**"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
});
