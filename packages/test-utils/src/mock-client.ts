import type { Mock } from "vitest";
import { vi } from "vitest";

export type MockClient = Mock<(...args: unknown[]) => unknown>;

export const setupMockClient = (): MockClient => {
  const client = vi.fn();

  vi.mock("@repo/api", () => ({
    createClient: () => client,
  }));

  return client;
};
