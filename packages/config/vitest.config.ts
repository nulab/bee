import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "config",
    setupFiles: ["@repo/test-utils/setup"],
  },
});
