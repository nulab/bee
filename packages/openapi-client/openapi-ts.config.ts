import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../openapi/tsp-output/@typespec/openapi3/openapi.yaml",
  output: "src/generated",
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      validator: true,
    },
    "@hey-api/client-ofetch",
    "valibot",
  ],
});
