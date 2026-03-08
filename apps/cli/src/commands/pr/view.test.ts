import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getPullRequest: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
  pullRequestUrl: vi.fn(
    (host: string, project: string, repo: string, num: number) =>
      `https://${host}/git/${project}/${repo}/pullRequests/${num}`,
  ),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const samplePullRequest = {
  id: 1,
  number: 42,
  summary: "Add feature A",
  description: "Detailed description",
  base: "main",
  branch: "feature-a",
  status: { id: 1, name: "Open" },
  assignee: { name: "Alice" },
  createdUser: { name: "Bob" },
  created: "2025-01-01T00:00:00Z",
  updated: "2025-01-02T00:00:00Z",
  mergeAt: null,
  closeAt: null,
};

describe("pr view", () => {
  it("displays pull request details", async () => {
    mockClient.getPullRequest.mockResolvedValue(samplePullRequest);

    const { view } = await import("./view");
    await view.run?.({ args: { number: "42", project: "PROJ", repo: "repo" } } as never);

    expect(mockClient.getPullRequest).toHaveBeenCalledWith("PROJ", "repo", 42);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#42"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Add feature A"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("main"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("feature-a"));
  });

  it("shows Unassigned for pull requests without assignee", async () => {
    mockClient.getPullRequest.mockResolvedValue({ ...samplePullRequest, assignee: null });

    const { view } = await import("./view");
    await view.run?.({ args: { number: "42", project: "PROJ", repo: "repo" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("displays description when present", async () => {
    mockClient.getPullRequest.mockResolvedValue(samplePullRequest);

    const { view } = await import("./view");
    await view.run?.({ args: { number: "42", project: "PROJ", repo: "repo" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Description"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Detailed description"));
  });

  it("opens browser with --web flag", async () => {
    const { view } = await import("./view");
    await view.run?.({ args: { number: "42", project: "PROJ", repo: "repo", web: true } } as never);

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/git/PROJ/repo/pullRequests/42",
      false,
      consola,
    );
    expect(mockClient.getPullRequest).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getPullRequest.mockResolvedValue(samplePullRequest);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { number: "42", project: "PROJ", repo: "repo", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Add feature A"));
    writeSpy.mockRestore();
  });
});
