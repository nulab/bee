import { openUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: {}, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  issueUrl: vi.fn((host: string, key: string) => `https://${host}/view/${key}`),
  projectUrl: vi.fn((host: string, key: string) => `https://${host}/projects/${key}`),
  repositoryUrl: vi.fn(
    (host: string, project: string, repo: string) => `https://${host}/git/${project}/${repo}`,
  ),
  dashboardUrl: vi.fn((host: string) => `https://${host}/dashboard`),
  buildBacklogUrl: vi.fn((host: string, path: string) => `https://${host}${path}`),
  gitBlobUrl: vi.fn(
    (host: string, project: string, repo: string, branch: string, path: string, line?: number) =>
      `https://${host}/git/${project}/${repo}/blob/${branch}/${path}${line ? `#${line}` : ""}`,
  ),
  gitTreeUrl: vi.fn(
    (host: string, project: string, repo: string, branch: string, dir?: string) =>
      `https://${host}/git/${project}/${repo}/tree/${branch}${dir ? `/${dir}` : ""}`,
  ),
  gitCommitUrl: vi.fn(
    (host: string, project: string, repo: string, sha: string) =>
      `https://${host}/git/${project}/${repo}/commit/${sha}`,
  ),
  detectGitContext: vi.fn(() => Promise.resolve(undefined)),
  getCurrentBranch: vi.fn(() => Promise.resolve("main")),
  getLatestCommit: vi.fn(() => Promise.resolve("abc1234")),
  getRepoRelativePath: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const { detectGitContext, getLatestCommit, getRepoRelativePath } = vi.mocked(
  await import("@repo/backlog-utils"),
);

const setupGitContext = () => {
  detectGitContext.mockResolvedValueOnce({
    host: "example.backlog.com",
    projectKey: "PROJ",
    repoName: "my-repo",
  });
};

describe("browse", () => {
  describe("without git context", () => {
    it("opens dashboard when no arguments", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: {} } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/dashboard");
      expect(consola.info).toHaveBeenCalledWith(
        "Opening https://example.backlog.com/dashboard in your browser.",
      );
    });

    it("opens issue page for issue key target", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "PROJ-123" } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/view/PROJ-123");
    });

    it("opens project page for project key", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "MYPROJECT" } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/projects/MYPROJECT");
    });
  });

  describe("project section flags", () => {
    it("opens issues page with --issues flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", issues: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/find/PROJ");
    });

    it("opens board page with --board flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", board: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/board/PROJ");
    });

    it("opens gantt page with --gantt flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", gantt: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/gantt/PROJ");
    });

    it("opens wiki page with --wiki flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", wiki: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/wiki/PROJ");
    });

    it("opens documents page with --documents flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", documents: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/document/PROJ");
    });

    it("opens shared files page with --files flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", files: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/file/PROJ");
    });

    it("opens git page with --git flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", git: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/git/PROJ");
    });

    it("opens svn page with --svn flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", svn: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/subversion/PROJ");
    });

    it("opens settings page with --settings flag", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { project: "PROJ", settings: true } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/EditProject.action?project.id=PROJ",
      );
    });

    it("infers project from git context for section flags", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: { board: true } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/board/PROJ");
    });
  });

  describe("with git context", () => {
    it("opens repository page when no arguments", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: {} } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/git/PROJ/my-repo");
    });

    it("resolves bare issue number with inferred project", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "123" } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/view/PROJ-123");
    });

    it("resolves bare issue number with explicit --project over git context", async () => {
      detectGitContext.mockResolvedValueOnce({
        host: "example.backlog.com",
        projectKey: "GITPROJ",
        repoName: "my-repo",
      });

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "456", project: "EXPLICIT" } } as never);

      expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/view/EXPLICIT-456");
    });
  });

  describe("file path browsing", () => {
    it("opens file blob URL", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "src/main.ts" } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/blob/main/src/main.ts",
      );
    });

    it("opens file blob URL with line number", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "src/main.ts:42" } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/blob/main/src/main.ts#42",
      );
    });

    it("opens directory tree URL", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "src/" } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/tree/main/src",
      );
    });

    it("prepends repo-relative path to file path", async () => {
      setupGitContext();
      getRepoRelativePath.mockResolvedValueOnce("packages/utils/");

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "src/index.ts" } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/blob/main/packages/utils/src/index.ts",
      );
    });
  });

  describe("--branch flag", () => {
    it("opens file at specific branch", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "src/main.ts", branch: "develop" } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/blob/develop/src/main.ts",
      );
    });

    it("opens tree root at branch when no target", async () => {
      setupGitContext();

      const { browse } = await import("./browse");
      await browse.run?.({ args: { branch: "develop" } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/tree/develop",
      );
    });
  });

  describe("--commit flag", () => {
    it("opens commit page when no target", async () => {
      setupGitContext();
      getLatestCommit.mockResolvedValueOnce("deadbeef123");

      const { browse } = await import("./browse");
      await browse.run?.({ args: { commit: true } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/commit/deadbeef123",
      );
    });

    it("opens file at commit SHA when target provided", async () => {
      setupGitContext();
      getLatestCommit.mockResolvedValueOnce("deadbeef123");

      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "src/main.ts", commit: true } } as never);

      expect(openUrl).toHaveBeenCalledWith(
        "https://example.backlog.com/git/PROJ/my-repo/blob/deadbeef123/src/main.ts",
      );
    });
  });

  describe("--no-browser flag", () => {
    it("prints URL without opening browser", async () => {
      const { browse } = await import("./browse");
      await browse.run?.({ args: { target: "PROJ-123", "no-browser": true } } as never);

      expect(consola.log).toHaveBeenCalledWith("https://example.backlog.com/view/PROJ-123");
      expect(openUrl).not.toHaveBeenCalled();
    });
  });
});
