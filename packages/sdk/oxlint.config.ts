import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

export default defineConfig({
  extends: [baseConfig],
  rules: {
    "no-unused-vars": "off",
    "typescript/no-explicit-any": "off",
  },
  ignorePatterns: ["node_modules/**", "dist/**", "src/generated/**"],
});
