import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "*.d.ts"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      ...eslintReact.configs.recommended.plugins,
    },
    settings: {
      ...eslintReact.configs.recommended.settings,
    },
    rules: {
      ...eslintReact.configs.recommended.rules,
      "no-console": "warn",
    },
  },
];
