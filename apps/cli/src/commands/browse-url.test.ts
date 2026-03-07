import { describe, expect, it } from "vitest";
import { type GitInfo, isFilePath, resolveUrl } from "./browse-url";

const HOST = "example.backlog.com";

const gitInfo = (overrides?: Partial<GitInfo>): GitInfo => ({
  context: { host: HOST, projectKey: "PROJ", repoName: "my-repo" },
  currentBranch: "main",
  latestCommit: "abc1234",
  ...overrides,
});

const noGit: GitInfo = {};

describe("resolveUrl", () => {
  describe("issue key target", () => {
    it("resolves full issue key", () => {
      expect(resolveUrl(HOST, { target: "PROJ-123" }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/view/PROJ-123",
      });
    });

    it("resolves issue key with underscore in project", () => {
      expect(resolveUrl(HOST, { target: "MY_PROJ-1" }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/view/MY_PROJ-1",
      });
    });
  });

  describe("bare issue number", () => {
    it("resolves with git context project", () => {
      expect(resolveUrl(HOST, { target: "123" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/view/PROJ-123",
      });
    });

    it("resolves with explicit --project over git context", () => {
      expect(resolveUrl(HOST, { target: "456", project: "OTHER" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/view/OTHER-456",
      });
    });

    it("returns error without project context", () => {
      const result = resolveUrl(HOST, { target: "123" }, noGit);
      expect(result.ok).toBe(false);
    });
  });

  describe("project section flags", () => {
    it("opens issues page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", issues: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/find/PROJ",
      });
    });

    it("opens board page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", board: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/board/PROJ",
      });
    });

    it("opens gantt page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", gantt: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/gantt/PROJ",
      });
    });

    it("opens wiki page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", wiki: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/wiki/PROJ",
      });
    });

    it("opens documents page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", documents: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/document/PROJ",
      });
    });

    it("opens files page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", files: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/file/PROJ",
      });
    });

    it("opens git page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", git: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ",
      });
    });

    it("opens svn page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", svn: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/subversion/PROJ",
      });
    });

    it("opens settings page", () => {
      expect(resolveUrl(HOST, { project: "PROJ", settings: true }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/EditProject.action?project.id=PROJ",
      });
    });

    it("infers project from git context", () => {
      expect(resolveUrl(HOST, { board: true }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/board/PROJ",
      });
    });
  });

  describe("project key target (no section flag)", () => {
    it("opens project page", () => {
      expect(resolveUrl(HOST, { target: "MYPROJECT" }, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/projects/MYPROJECT",
      });
    });
  });

  describe("no target, no flags", () => {
    it("opens dashboard without git context", () => {
      expect(resolveUrl(HOST, {}, noGit)).toEqual({
        ok: true,
        url: "https://example.backlog.com/dashboard",
      });
    });

    it("opens repository page with git context", () => {
      expect(resolveUrl(HOST, {}, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo",
      });
    });
  });

  describe("file path target", () => {
    it("opens file blob URL", () => {
      expect(resolveUrl(HOST, { target: "src/main.ts" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/blob/main/src/main.ts",
      });
    });

    it("opens file with line number", () => {
      expect(resolveUrl(HOST, { target: "src/main.ts:42" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/blob/main/src/main.ts#42",
      });
    });

    it("opens directory tree URL", () => {
      expect(resolveUrl(HOST, { target: "src/" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/tree/main/src",
      });
    });

    it("prepends repo-relative path", () => {
      expect(
        resolveUrl(
          HOST,
          { target: "src/index.ts" },
          gitInfo({ repoRelativePath: "packages/utils/" }),
        ),
      ).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/blob/main/packages/utils/src/index.ts",
      });
    });

    it("opens file with dot in name", () => {
      expect(resolveUrl(HOST, { target: "config.json" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/blob/main/config.json",
      });
    });

    it("returns error without git context", () => {
      const result = resolveUrl(HOST, { target: "src/main.ts" }, noGit);
      expect(result.ok).toBe(false);
    });
  });

  describe("--branch flag", () => {
    it("opens file at specific branch", () => {
      expect(resolveUrl(HOST, { target: "src/main.ts", branch: "develop" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/blob/develop/src/main.ts",
      });
    });

    it("opens tree root at branch when no target", () => {
      expect(resolveUrl(HOST, { branch: "develop" }, gitInfo())).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/tree/develop",
      });
    });
  });

  describe("--commit flag", () => {
    it("opens commit page when no target", () => {
      expect(resolveUrl(HOST, { commit: true }, gitInfo({ latestCommit: "deadbeef" }))).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/commit/deadbeef",
      });
    });

    it("opens file at commit SHA", () => {
      expect(
        resolveUrl(
          HOST,
          { target: "src/main.ts", commit: true },
          gitInfo({ latestCommit: "deadbeef" }),
        ),
      ).toEqual({
        ok: true,
        url: "https://example.backlog.com/git/PROJ/my-repo/blob/deadbeef/src/main.ts",
      });
    });

    it("returns error when commit cannot be determined", () => {
      const result = resolveUrl(HOST, { commit: true }, gitInfo({ latestCommit: undefined }));
      expect(result.ok).toBe(false);
    });
  });
});

describe("isFilePath", () => {
  it("returns true for paths with /", () => {
    expect(isFilePath("src/main.ts")).toBe(true);
  });

  it("returns true for file with extension", () => {
    expect(isFilePath("main.ts")).toBe(true);
  });

  it("returns true for path with line number", () => {
    expect(isFilePath("main.ts:42")).toBe(true);
  });

  it("returns true for directory path", () => {
    expect(isFilePath("src/")).toBe(true);
  });

  it("returns false for issue key pattern", () => {
    expect(isFilePath("PROJ-123")).toBe(false);
  });

  it("returns false for plain project key", () => {
    expect(isFilePath("MYPROJECT")).toBe(false);
  });

  it("returns false for bare number", () => {
    expect(isFilePath("123")).toBe(false);
  });
});
