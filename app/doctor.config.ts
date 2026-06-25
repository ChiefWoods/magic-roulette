import { defineConfig } from "react-doctor/api";

export default defineConfig({
  rules: {
    "react-doctor/active-static-asset": "off",
  },
  ignore: {
    files: ["src/components/ui/**"],
  },
});