import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "cli-utils",
    setupFiles: ["@repo/test-utils/setup"],
  },
});
