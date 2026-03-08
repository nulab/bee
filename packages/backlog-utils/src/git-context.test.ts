import { describe, expect, it } from "vitest";
import { parseBacklogRemoteUrl } from "./git-context";

describe("parseBacklogRemoteUrl", () => {
  describe("SCP-like format", () => {
    it("parses standard SCP URL with .backlog.com", () => {
      const result = parseBacklogRemoteUrl("user@example.git.backlog.com:/PROJECT/my-repo.git");
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses SCP URL with .backlog.jp", () => {
      const result = parseBacklogRemoteUrl("user@example.git.backlog.jp:/PROJECT/my-repo.git");
      expect(result).toEqual({
        host: "example.backlog.jp",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses SCP URL without leading slash", () => {
      const result = parseBacklogRemoteUrl("user@example.git.backlog.com:PROJECT/my-repo.git");
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses SCP URL without .git suffix", () => {
      const result = parseBacklogRemoteUrl("user@example.git.backlog.com:/PROJECT/my-repo");
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });
  });

  describe("SSH URL format", () => {
    it("parses ssh:// URL with .backlog.com", () => {
      const result = parseBacklogRemoteUrl(
        "ssh://user@example.git.backlog.com/PROJECT/my-repo.git",
      );
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses ssh:// URL with .backlog.jp", () => {
      const result = parseBacklogRemoteUrl("ssh://user@example.git.backlog.jp/PROJECT/my-repo.git");
      expect(result).toEqual({
        host: "example.backlog.jp",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses ssh:// URL without .git suffix", () => {
      const result = parseBacklogRemoteUrl("ssh://user@example.git.backlog.com/PROJECT/my-repo");
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });
  });

  describe("HTTPS format", () => {
    it("parses standard HTTPS URL with .backlog.com", () => {
      const result = parseBacklogRemoteUrl("https://example.backlog.com/git/PROJECT/my-repo.git");
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses HTTPS URL with .backlog.jp", () => {
      const result = parseBacklogRemoteUrl("https://example.backlog.jp/git/PROJECT/my-repo.git");
      expect(result).toEqual({
        host: "example.backlog.jp",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses HTTPS URL without .git suffix", () => {
      const result = parseBacklogRemoteUrl("https://example.backlog.com/git/PROJECT/my-repo");
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });

    it("parses HTTP URL", () => {
      const result = parseBacklogRemoteUrl("http://example.backlog.com/git/PROJECT/my-repo.git");
      expect(result).toEqual({
        host: "example.backlog.com",
        projectKey: "PROJECT",
        repoName: "my-repo",
      });
    });
  });

  describe("non-Backlog URLs", () => {
    it("returns undefined for GitHub SSH URL", () => {
      expect(parseBacklogRemoteUrl("git@github.com:user/repo.git")).toBeUndefined();
    });

    it("returns undefined for GitHub HTTPS URL", () => {
      expect(parseBacklogRemoteUrl("https://github.com/user/repo.git")).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(parseBacklogRemoteUrl("")).toBeUndefined();
    });

    it("returns undefined for random string", () => {
      expect(parseBacklogRemoteUrl("not-a-url")).toBeUndefined();
    });
  });
});
