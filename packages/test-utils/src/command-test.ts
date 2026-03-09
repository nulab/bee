import { type Mock, vi } from "vitest";

type MockClientMethods = Record<string, Mock>;

type CommandTestContext = {
  mockClient: MockClientMethods & {
    getMyself: Mock;
    getProjects: Mock;
  };
  host: string;
};

/**
 * Sets up standard mocks for command tests.
 *
 * Mocks `@repo/backlog-utils` (getClient), `consola`, and optionally `@repo/cli-utils`.
 * Returns a `mockClient` object with the specified methods plus default `getMyself` and `getProjects`.
 */
const setupCommandTest = (
  clientMethods: MockClientMethods,
  options?: { mockPrompt?: boolean },
): CommandTestContext => {
  const defaultMyself = vi.fn().mockResolvedValue({ id: 99 });
  const defaultProjects = vi.fn().mockResolvedValue([{ id: 123, projectKey: "PROJ" }]);

  const mockClient = {
    getMyself: defaultMyself,
    getProjects: defaultProjects,
    ...clientMethods,
  };

  const host = "example.backlog.com";

  vi.mock("@repo/backlog-utils", async (importOriginal) => ({
    ...(await importOriginal()),
    getClient: vi.fn(() => Promise.resolve({ client: mockClient, host })),
  }));

  vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

  if (options?.mockPrompt) {
    vi.mock("@repo/cli-utils", async (importOriginal) => ({
      ...(await importOriginal()),
      promptRequired: vi.fn(),
      confirmOrExit: vi.fn(),
    }));
  }

  return { mockClient, host };
};

export { setupCommandTest };
export type { CommandTestContext, MockClientMethods };
