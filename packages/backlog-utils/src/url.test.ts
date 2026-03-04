import { describe, expect, it, vi } from "vitest";
import {
  buildBacklogUrl,
  dashboardUrl,
  documentUrl,
  issueUrl,
  openUrl,
  projectUrl,
  pullRequestUrl,
  repositoryUrl,
  wikiUrl,
} from "#src/url";
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
      "https://example.backlog.com/projects/PROJ/document/abc-123",
    );
  });
});

describe("dashboardUrl", () => {
  it("builds dashboard URL", () => {
    expect(dashboardUrl("example.backlog.com")).toBe("https://example.backlog.com/dashboard");
  });
});

describe("openUrl", () => {
  it("opens URL in the default browser", async () => {
    await openUrl("https://example.backlog.com/view/PROJ-1");
    expect(open).toHaveBeenCalledWith("https://example.backlog.com/view/PROJ-1");
  });
});
