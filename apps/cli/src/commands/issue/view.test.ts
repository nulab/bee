import { getClient, openUrl } from "@repo/backlog-utils";
import { issuesGet, issuesGetComments } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
  openUrl: vi.fn(),
  issueUrl: vi.fn((host: string, key: string) => `https://${host}/view/${key}`),
}));

vi.mock("@repo/openapi-client", () => ({
  issuesGet: vi.fn(),
  issuesGetComments: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockClient = {
  interceptors: { request: { use: vi.fn() } },
};

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

const sampleIssue = {
  id: 1,
  issueKey: "PROJ-1",
  summary: "Test issue",
  description: "A test description",
  status: { name: "Open" },
  issueType: { name: "Bug" },
  priority: { name: "High" },
  assignee: { name: "Alice" },
  createdUser: { name: "Bob" },
  created: "2025-01-01T00:00:00Z",
  updated: "2025-01-02T00:00:00Z",
  startDate: null,
  dueDate: null,
  estimatedHours: null,
  actualHours: null,
  category: [],
  milestone: [],
  version: [],
};

describe("issue view", () => {
  it("displays issue details", async () => {
    setupMocks();
    vi.mocked(issuesGet).mockResolvedValue({
      data: sampleIssue,
    } as never);

    const { view } = await import("./view");
    await view.run?.({ args: { issue: "PROJ-1" } } as never);

    expect(issuesGet).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { issueIdOrKey: "PROJ-1" },
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test issue"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("High"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
  });

  it("shows Unassigned for issues without assignee", async () => {
    setupMocks();
    vi.mocked(issuesGet).mockResolvedValue({
      data: { ...sampleIssue, assignee: null },
    } as never);

    const { view } = await import("./view");
    await view.run?.({ args: { issue: "PROJ-1" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("displays description when present", async () => {
    setupMocks();
    vi.mocked(issuesGet).mockResolvedValue({
      data: sampleIssue,
    } as never);

    const { view } = await import("./view");
    await view.run?.({ args: { issue: "PROJ-1" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Description"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("A test description"));
  });

  it("fetches and displays comments with --comments flag", async () => {
    setupMocks();
    vi.mocked(issuesGet).mockResolvedValue({
      data: sampleIssue,
    } as never);
    vi.mocked(issuesGetComments).mockResolvedValue({
      data: [
        {
          content: "A comment",
          createdUser: { name: "Charlie" },
          created: "2025-01-03T00:00:00Z",
        },
      ],
    } as never);

    const { view } = await import("./view");
    await view.run?.({ args: { issue: "PROJ-1", comments: true } } as never);

    expect(issuesGetComments).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { issueIdOrKey: "PROJ-1" },
        query: { order: "asc" },
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Comments"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Charlie"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("A comment"));
  });

  it("opens browser with --web flag", async () => {
    setupMocks();

    const { view } = await import("./view");
    await view.run?.({ args: { issue: "PROJ-1", web: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/view/PROJ-1");
    expect(consola.info).toHaveBeenCalledWith(
      "Opening https://example.backlog.com/view/PROJ-1 in your browser.",
    );
    expect(issuesGet).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    vi.mocked(issuesGet).mockResolvedValue({
      data: sampleIssue,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { issue: "PROJ-1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    writeSpy.mockRestore();
  });
});
