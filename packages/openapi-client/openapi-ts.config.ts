import { defineConfig } from "@hey-api/openapi-ts";

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  input: "../openapi/tsp-output/@typespec/openapi3/openapi.yaml",
  output: "src/generated",
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      validator: true,
    },
    {
      name: "@hey-api/client-ofetch",
      runtimeConfigPath: "../hey-api.ts",
    },
    "valibot",
  ],
});
