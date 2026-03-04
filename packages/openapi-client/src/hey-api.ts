import type { CreateClientConfig } from "./generated/client/types.gen.js";
import { resolveSpace } from "@repo/config";

const resolveBaseUrl = (): string | undefined => {
  const space = resolveSpace();
  if (space) {
    return `https://${space.host}/api/v2`;
  }
  return undefined;
};

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: resolveBaseUrl() ?? config?.baseUrl ?? "",
});
