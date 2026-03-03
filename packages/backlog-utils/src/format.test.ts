import type {
  BacklogIssue,
  BacklogNotification,
  BacklogProject,
  BacklogPullRequest,
  BacklogRepository,
} from "@repo/api";

import {
  formatDate,
  formatIssueLine,
  formatNotificationLine,
  formatProjectLine,
  formatPullRequestLine,
  formatRepositoryLine,
  getActivityLabel,
  padEnd,
} from "#/format.js";
import { describe, expect, it } from "vitest";

describe("formatDate", () => {
  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatDate("")).toBe("");
  });

  it("extracts yyyy-MM-dd from ISO date", () => {
    expect(formatDate("2024-03-15T10:30:00.000Z")).toBe("2024-03-15");
  });

  it("handles date-only string", () => {
    expect(formatDate("2024-12-01")).toBe("2024-12-01");
  });
});

describe("padEnd", () => {
  it("pads shorter string to target width", () => {
    const result = padEnd("abc", 6);
    expect(result).toBe("abc   ");
    expect(result).toHaveLength(6);
  });

  it("truncates string longer than width with ellipsis", () => {
    const result = padEnd("long string here", 8);
    expect(result).toBe("long st\u2026");
    expect(result).toHaveLength(8);
  });

  it("truncates string exactly at width with ellipsis", () => {
    const result = padEnd("abcdef", 6);
    expect(result).toBe("abcde\u2026");
  });

  it("pads string shorter than width", () => {
    const result = padEnd("ab", 5);
    expect(result).toBe("ab   ");
  });
});

describe("formatIssueLine", () => {
  const baseIssue = {
    issueKey: "PROJ-1",
    status: { name: "Open" },
    issueType: { name: "Bug" },
    priority: { name: "High" },
    assignee: { name: "Taro" },
    summary: "Fix the bug",
  } as BacklogIssue;

  it("formats an issue with assignee", () => {
    const line = formatIssueLine(baseIssue);
    expect(line).toContain("PROJ-1");
    expect(line).toContain("Open");
    expect(line).toContain("Bug");
    expect(line).toContain("High");
    expect(line).toContain("Taro");
    expect(line).toContain("Fix the bug");
  });

  it("handles null assignee", () => {
    const issue = { ...baseIssue, assignee: null } as BacklogIssue;
    const line = formatIssueLine(issue);
    expect(line).toContain("PROJ-1");
    expect(line).toContain("Fix the bug");
  });
});

describe("formatProjectLine", () => {
  it("formats active project", () => {
    const project = {
      projectKey: "PROJ",
      name: "My Project",
      archived: false,
    } as BacklogProject;
    const line = formatProjectLine(project);
    expect(line).toContain("PROJ");
    expect(line).toContain("My Project");
    expect(line).toContain("Active");
  });

  it("formats archived project", () => {
    const project = {
      projectKey: "OLD",
      name: "Old Project",
      archived: true,
    } as BacklogProject;
    const line = formatProjectLine(project);
    expect(line).toContain("OLD");
    expect(line).toContain("Archived");
  });
});

describe("getActivityLabel", () => {
  it("returns label for known activity type", () => {
    expect(getActivityLabel(1)).toBe("Issue Created");
    expect(getActivityLabel(2)).toBe("Issue Updated");
    expect(getActivityLabel(3)).toBe("Issue Commented");
    expect(getActivityLabel(12)).toBe("Git Pushed");
    expect(getActivityLabel(18)).toBe("Pull Request Added");
  });

  it("returns fallback for unknown activity type", () => {
    expect(getActivityLabel(999)).toBe("Activity (999)");
  });
});

describe("formatPullRequestLine", () => {
  const basePR = {
    number: 42,
    status: { name: "Open" },
    assignee: { name: "Taro" },
    branch: "feature/add-tests",
    base: "main",
    summary: "Add unit tests",
  } as BacklogPullRequest;

  it("formats pull request line", () => {
    const line = formatPullRequestLine(basePR);
    expect(line).toContain("#42");
    expect(line).toContain("Open");
    expect(line).toContain("Taro");
    expect(line).toContain("feature/add-tests");
    expect(line).toContain("main");
    expect(line).toContain("Add unit tests");
  });

  it("handles null assignee", () => {
    const pr = { ...basePR, assignee: null } as BacklogPullRequest;
    const line = formatPullRequestLine(pr);
    expect(line).toContain("#42");
    expect(line).toContain("Add unit tests");
  });
});

describe("formatRepositoryLine", () => {
  it("formats repository with description", () => {
    const repo = {
      name: "my-repo",
      description: "A test repository",
    } as BacklogRepository;
    const line = formatRepositoryLine(repo);
    expect(line).toContain("my-repo");
    expect(line).toContain("A test repository");
  });

  it("formats repository with null description", () => {
    const repo = {
      name: "my-repo",
      description: null,
    } as BacklogRepository;
    const line = formatRepositoryLine(repo);
    expect(line).toContain("my-repo");
  });
});

describe("formatNotificationLine", () => {
  const baseNotification = {
    id: 12_345,
    alreadyRead: false,
    reason: 1,
    sender: { name: "Taro" },
    issue: { summary: "Fix the bug" },
  } as BacklogNotification;

  it("formats unread notification", () => {
    const line = formatNotificationLine(baseNotification);
    expect(line).toContain("* ");
    expect(line).toContain("12345");
    expect(line).toContain("Assigned");
    expect(line).toContain("Taro");
    expect(line).toContain("Fix the bug");
  });

  it("formats read notification", () => {
    const notification = {
      ...baseNotification,
      alreadyRead: true,
    } as BacklogNotification;
    const line = formatNotificationLine(notification);
    expect(line).toContain("  ");
    expect(line).not.toMatch(/^\* /);
  });

  it("formats pull request notification", () => {
    const notification = {
      ...baseNotification,
      issue: undefined,
      pullRequest: { summary: "Add feature" },
    } as unknown as BacklogNotification;
    const line = formatNotificationLine(notification);
    expect(line).toContain("Add feature");
  });

  it("formats comment notification", () => {
    const notification = {
      ...baseNotification,
      issue: undefined,
      comment: { content: "This is a comment" },
    } as unknown as BacklogNotification;
    const line = formatNotificationLine(notification);
    expect(line).toContain("This is a comment");
  });

  it("shows Other for unknown reason code", () => {
    const notification = {
      ...baseNotification,
      reason: 999,
    } as BacklogNotification;
    const line = formatNotificationLine(notification);
    expect(line).toContain("Other");
  });
});
