import { describe, expect, it, vi } from "vitest";
import {
  buildBacklogUrl,
  dashboardUrl,
  documentUrl,
  gitBlobUrl,
  gitCommitUrl,
  gitTreeUrl,
  issueUrl,
  openUrl,
  projectUrl,
  pullRequestUrl,
  repositoryUrl,
  wikiUrl,
} from "./url";
import open from "open";

vi.mock("open", () => ({
  default: vi.fn(),
}));

describe("buildBacklogUrl", () => {
  it("builds URL from host and path", () => {
    expect(buildBacklogUrl("example.backlog.com", "/view/PROJ-1")).toBe(
      "https://example.backlog.com/view/PROJ-1",
    );
  });

  it("preserves query parameters in path", () => {
    expect(buildBacklogUrl("example.backlog.com", "/EditProject.action?project.key=PROJ")).toBe(
      "https://example.backlog.com/EditProject.action?project.key=PROJ",
    );
  });
});

describe("issueUrl", () => {
  it("builds URL from issue key", () => {
    expect(issueUrl("example.backlog.com", "PROJ-123")).toBe(
      "https://example.backlog.com/view/PROJ-123",
    );
  });
});

describe("projectUrl", () => {
  it("builds URL from project key", () => {
    expect(projectUrl("example.backlog.com", "PROJ")).toBe(
      "https://example.backlog.com/projects/PROJ",
    );
  });
});

describe("pullRequestUrl", () => {
  it("builds pull request URL", () => {
    expect(pullRequestUrl("example.backlog.com", "PROJ", "my-repo", 42)).toBe(
      "https://example.backlog.com/git/PROJ/my-repo/pullRequests/42",
    );
  });
});

describe("repositoryUrl", () => {
  it("builds repository URL", () => {
    expect(repositoryUrl("example.backlog.com", "PROJ", "my-repo")).toBe(
      "https://example.backlog.com/git/PROJ/my-repo",
    );
  });
});

describe("wikiUrl", () => {
  it("builds wiki URL from page ID", () => {
    expect(wikiUrl("example.backlog.com", 999)).toBe("https://example.backlog.com/alias/wiki/999");
  });
});

describe("documentUrl", () => {
  it("builds document URL", () => {
    expect(documentUrl("example.backlog.com", "PROJ", "abc-123")).toBe(
      "https://example.backlog.com/document/PROJ/abc-123",
    );
  });
});

describe("dashboardUrl", () => {
  it("builds dashboard URL", () => {
    expect(dashboardUrl("example.backlog.com")).toBe("https://example.backlog.com/dashboard");
  });
});

describe("gitBlobUrl", () => {
  it("builds file blob URL", () => {
    expect(gitBlobUrl("example.backlog.com", "PROJ", "my-repo", "main", "src/index.ts")).toBe(
      "https://example.backlog.com/git/PROJ/my-repo/blob/main/src/index.ts",
    );
  });

  it("builds file blob URL with line number", () => {
    expect(gitBlobUrl("example.backlog.com", "PROJ", "my-repo", "main", "src/index.ts", 42)).toBe(
      "https://example.backlog.com/git/PROJ/my-repo/blob/main/src/index.ts#42",
    );
  });
});

describe("gitTreeUrl", () => {
  it("builds tree URL at branch root", () => {
    expect(gitTreeUrl("example.backlog.com", "PROJ", "my-repo", "main")).toBe(
      "https://example.backlog.com/git/PROJ/my-repo/tree/main",
    );
  });

  it("builds tree URL with directory path", () => {
    expect(gitTreeUrl("example.backlog.com", "PROJ", "my-repo", "main", "src/lib")).toBe(
      "https://example.backlog.com/git/PROJ/my-repo/tree/main/src/lib",
    );
  });
});

describe("gitCommitUrl", () => {
  it("builds commit URL", () => {
    expect(gitCommitUrl("example.backlog.com", "PROJ", "my-repo", "abc1234")).toBe(
      "https://example.backlog.com/git/PROJ/my-repo/commit/abc1234",
    );
  });
});

describe("openUrl", () => {
  it("opens URL in the default browser", async () => {
    await openUrl("https://example.backlog.com/view/PROJ-1");
    expect(open).toHaveBeenCalledWith("https://example.backlog.com/view/PROJ-1");
  });
});
