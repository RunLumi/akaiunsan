// ESLint 9 flat config (Phase 0 of docs/mobile-app-upgrade-plan.md).
// The `any` budget is ratcheted down in Phase 3 via the `no-explicit-any`
// warning + `max-warnings` CI gate; Phase 4/5 remove the remaining usages.
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

const TS_PROJECT = "./tsconfig.json";

export default [
  {
    ignores: ["node_modules/**", "ios/**", "android/**", "coverage/**", "build/**", "vendor/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: TS_PROJECT, tsconfigRootDir: import.meta.dirname },
      globals: {
        fetch: "readonly",
        require: "readonly",
        FormData: "readonly",
        navigator: "readonly",
        parseInt: "readonly",
        __DEV__: "readonly",
        logDebug: "readonly",
        logError: "readonly",
        logWarn: "readonly",
        console: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tseslint, react: reactPlugin },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react/prop-types": "off",
      "react/no-string-refs": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-children-prop": "off",
      "react/jsx-key": "off",
      "react/display-name": "off",
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-constant-condition": "off",
      "no-control-regex": "off",
      "no-useless-escape": "off",
      "no-extra-boolean-cast": "off",
      "no-prototype-builtins": "off",
      "no-undef": "off",
      "no-redeclare": "off",
      "no-func-assign": "off",
      "no-case-declarations": "off",
    },
  },
  prettier,
];