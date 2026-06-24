import { defineConfig } from "oxfmt";

export default defineConfig({
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  sortImports: true,
  sortTailwindcss: true,
  sortPackageJson: false,
  ignorePatterns: [
    ".anchor",
    ".DS_Store",
    "target",
    "node_modules",
    "dist",
    "build",
    "test-ledger",
    "migrations",
    "bruno",
    "*/idl/**.json",
    "tests/fixtures",
  ],
});
