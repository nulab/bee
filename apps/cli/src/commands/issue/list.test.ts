import { getClient } from "@repo/backlog-utils";
import { issuesList } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  issuesList: vi.fn(),
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

const sampleIssues = [
  {
    issueKey: "PROJ-1",
    summary: "First issue",
    status: { name: "Open" },
    issueType: { name: "Bug" },
    priority: { name: "High" },
    assignee: { name: "Alice" },
  },
  {
    issueKey: "PROJ-2",
    summary: "Second issue",
    status: { name: "In Progress" },
    issueType: { name: "Task" },
    priority: { name: "Normal" },
    assignee: null,
  },
];

describe("issue list", () => {
  it("displays issue list in tabular format", async () => {
    setupMocks();
    vi.mocked(issuesList).mockResolvedValue({
      data: sampleIssues,
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(issuesList).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("KEY"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-2"));
  });

  it("shows message when no issues found", async () => {
    setupMocks();
    vi.mocked(issuesList).mockResolvedValue({
      data: [],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No issues found.");
  });

  it("shows Unassigned for issues without assignee", async () => {
    setupMocks();
    vi.mocked(issuesList).mockResolvedValue({
      data: [sampleIssues[1]],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("passes project query parameter", async () => {
    setupMocks();
    vi.mocked(issuesList).mockResolvedValue({
      data: [],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "123" } } as never);

    expect(issuesList).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ "projectId[]": [123] }),
      }),
    );
  });

  it("passes assignee query parameter", async () => {
    setupMocks();
    vi.mocked(issuesList).mockResolvedValue({
      data: [],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: { assignee: "42" } } as never);

    expect(issuesList).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ "assigneeId[]": [42] }),
      }),
    );
  });

  it("passes keyword query parameter", async () => {
    setupMocks();
    vi.mocked(issuesList).mockResolvedValue({
      data: [],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: { keyword: "login bug" } } as never);

    expect(issuesList).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ keyword: "login bug" }),
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    vi.mocked(issuesList).mockResolvedValue({
      data: sampleIssues,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { list } = await import("./list");
    await list.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    writeSpy.mockRestore();
  });
});
