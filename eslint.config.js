import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      "node_modules",
      "supabase/**/*",
      "cloudflare-hyperdrive-worker/**/*",
      "scripts/**/*",
      "vitest.config.ts",
      "capacitor.config.ts",
      "wrangler.json",
      "wrangler.jsonc",
      "wrangler.toml",
      "check_table.js",
      "list-columns.js",
      "list-tables.js",
      "test-db.js",
      "supabase-diagnostic.js",
      "supabase-admin-diagnostic.js",
      "supabase-schema-audit.js",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintPluginPrettier],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "prettier/prettier": "error",
    },
  },
);
