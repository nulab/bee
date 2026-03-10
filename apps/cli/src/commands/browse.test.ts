import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { parseCommand } from "@repo/test-utils";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: {}, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
  detectGitContext: vi.fn(() => Promise.resolve(undefined)),
  getCurrentBranch: vi.fn(() => Promise.resolve("main")),
  getLatestCommit: vi.fn(() => Promise.resolve("abc1234")),
  getRepoRelativePath: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("./browse-url", () => ({
  resolveUrl: vi.fn(() => ({ ok: true, url: "https://example.backlog.com/mock-url" })),
  isFilePath: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const { resolveUrl: mockResolveUrl } = vi.mocked(await import("./browse-url"));

describe("browse", () => {
  it("opens resolved URL in browser", async () => {
    await parseCommand(() => import("./browse"));

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/mock-url",
      false,
      consola,
    );
  });

  it("prints URL without opening browser with --no-browser", async () => {
    await parseCommand(() => import("./browse"), ["--no-browser"]);

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/mock-url",
      true,
      consola,
    );
  });

  it("passes git info to resolveUrl", async () => {
    const { detectGitContext, getCurrentBranch, getLatestCommit, getRepoRelativePath } = vi.mocked(
      await import("@repo/backlog-utils"),
    );
    detectGitContext.mockResolvedValueOnce({
      host: "example.backlog.com",
      projectKey: "PROJ",
      repoName: "my-repo",
    });
    getCurrentBranch.mockResolvedValueOnce("feature-branch");
    getLatestCommit.mockResolvedValueOnce("deadbeef");
    getRepoRelativePath.mockResolvedValueOnce("src/");

    await parseCommand(() => import("./browse"), ["main.ts"]);

    expect(mockResolveUrl).toHaveBeenCalledWith(
      "example.backlog.com",
      expect.objectContaining({ target: "main.ts" }),
      {
        context: {
          host: "example.backlog.com",
          projectKey: "PROJ",
          repoName: "my-repo",
        },
        currentBranch: "feature-branch",
        latestCommit: "deadbeef",
        repoRelativePath: "src/",
      },
    );
  });
});
