import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  // 1) Ignorados globales
  {
    ignores: ["**/dist/**", "**/build/**", "**/node_modules/**", "**/coverage/**", "**/*.gen.ts"]
  },

  // 2) Base JS + TS (type-aware)
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // 3) Apaga conflictos de formato con Prettier
  eslintConfigPrettier,

  // 4) Reglas TS comunes para todo el monorepo
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir
      }
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "off"
    }
  },

  // 5) Override API (Nest, Node)
  {
    files: ["apps/api/src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
      // Alineado con tsconfig de api (module: nodenext)
      sourceType: "module"
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn"
    }
  },

  // 6) Override WEB (React/Vite)
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules
    }
  }
]);
