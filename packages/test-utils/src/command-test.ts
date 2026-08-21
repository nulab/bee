import { type Mock, vi } from "vitest";

// Since Vitest 4.1, a bare `vi.fn()` is typed `Mock<Procedure | Constructable>`,
// which has no call signature and is not assignable to `Mock`. Inputs accept
// that shape as-is; the returned client narrows to a callable Mock so tests
// can invoke and configure client methods directly.
type MockClientMethods = Record<string, ReturnType<typeof vi.fn>>;

type CallableMock = Mock<(...args: unknown[]) => unknown>;

type CommandTestContext = {
  mockClient: Record<string, CallableMock> & {
    getMyself: CallableMock;
    getProjects: CallableMock;
  };
  host: string;
};

const MOCK_HOST = "example.backlog.com";

/**
 * Creates a mock client with default `getMyself` and `getProjects` methods.
 * Call this inside `vi.hoisted()` or at the top level of a test file,
 * then use the returned values with `vi.mock()`.
 *
 * @example
 * ```typescript
 * const { mockClient, host } = setupCommandTest({ getCategories: vi.fn() });
 *
 * vi.mock("@repo/backlog-utils", () => ({
 *   getClient: vi.fn(() => Promise.resolve({ client: mockClient, host })),
 * }));
 * vi.mock("consola", () => import("@repo/test-utils/mock-consola"));
 * ```
 */
const setupCommandTest = (clientMethods: MockClientMethods): CommandTestContext => {
  const defaultMyself = vi.fn().mockResolvedValue({ id: 99 });
  const defaultProjects = vi.fn().mockResolvedValue([{ id: 123, projectKey: "PROJ" }]);

  const mockClient = {
    getMyself: defaultMyself,
    getProjects: defaultProjects,
    ...clientMethods,
  } as CommandTestContext["mockClient"];

  return { mockClient, host: MOCK_HOST };
};

/**
 * Standard vi.mock factory for `@repo/backlog-utils`.
 * Returns a module with only `getClient` mocked.
 */
const mockGetClient = (mockClient: MockClientMethods, host = MOCK_HOST) => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host })),
});

/**
 * Dynamically imports a command module and calls parseAsync with the given args.
 * Reduces the repeated 2-line pattern to a single call.
 *
 * @example
 * ```typescript
 * await parseCommand(() => import("./list"), ["--project", "123"]);
 * ```
 */
const parseCommand = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importFn: () => Promise<{ default: { parseAsync: (...args: any[]) => Promise<any> } }>,
  args: string[] = [],
): Promise<void> => {
  const { default: command } = await importFn();
  await command.parseAsync(args, { from: "user" });
};

export { MOCK_HOST, mockGetClient, parseCommand, setupCommandTest };
export type { CommandTestContext, MockClientMethods };
