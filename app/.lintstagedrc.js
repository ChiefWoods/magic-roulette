/** @type {import("lint-staged").Configuration} */
export default {
  "*.{jsx,tsx}": () => "bunx react-doctor --staged --no-score",
};
