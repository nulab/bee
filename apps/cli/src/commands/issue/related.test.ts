import consola from "consola";
import { describe, expect, it, vi } from "vite-plus/test";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getRelatedIssues: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const relatedIssue = (issueKey: string, assignee: { name: string } | null) => ({
  issueKey,
  summary: `Summary of ${issueKey}`,
  status: { name: "Open" },
  assignee,
  type: "RELATES",
});

describe("issue related", () => {
  it("lists related issues with key, status, assignee and summary", async () => {
    mockClient.getRelatedIssues.mockResolvedValue([relatedIssue("PROJ-2", { name: "Alice" })]);

    await parseCommand(() => import("./related"), ["PROJ-1"]);

    expect(mockClient.getRelatedIssues).toHaveBeenCalledWith("PROJ-1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-2"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Summary of PROJ-2"));
  });

  it("shows Unassigned for related issues without an assignee", async () => {
    mockClient.getRelatedIssues.mockResolvedValue([relatedIssue("PROJ-2", null)]);

    await parseCommand(() => import("./related"), ["PROJ-1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("shows message when no related issues found", async () => {
    mockClient.getRelatedIssues.mockResolvedValue([]);

    await parseCommand(() => import("./related"), ["PROJ-1"]);

    expect(consola.info).toHaveBeenCalledWith("No related issues found.");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./related"),
      ["PROJ-1", "--json"],
      "PROJ-2",
      () => {
        mockClient.getRelatedIssues.mockResolvedValue([relatedIssue("PROJ-2", null)]);
      },
    ),
  );
});
