import type { BacklogClient } from "#/client.js";

import {
  extractProjectKey,
  resolveByName,
  resolveClosedStatusId,
  resolveIssueTypeId,
  resolveOpenStatusId,
  resolvePriorityId,
  resolveProjectArg,
  resolveProjectId,
  resolveResolutionId,
  resolveStatusId,
  resolveUserId,
} from "#/resolve.js";
import { spyOnProcessExit } from "@repo/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const createMockClient = (responses: Record<string, unknown>): BacklogClient =>
  ((url: string) => {
    if (url in responses) {
      return Promise.resolve(responses[url]);
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  }) as unknown as BacklogClient;

describe("resolveProjectArg", () => {
  const originalEnv = process.env.BACKLOG_PROJECT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BACKLOG_PROJECT;
    } else {
      process.env.BACKLOG_PROJECT = originalEnv;
    }
  });

  it("returns the argument when provided", () => {
    expect(resolveProjectArg("MY_PROJECT")).toBe("MY_PROJECT");
  });

  it("prioritizes argument over environment variable", () => {
    process.env.BACKLOG_PROJECT = "ENV_PROJECT";
    expect(resolveProjectArg("ARG_PROJECT")).toBe("ARG_PROJECT");
  });

  it("falls back to BACKLOG_PROJECT environment variable", () => {
    process.env.BACKLOG_PROJECT = "ENV_PROJECT";
    expect(resolveProjectArg()).toBe("ENV_PROJECT");
  });

  it("calls process.exit(1) when neither argument nor env var is set", () => {
    delete process.env.BACKLOG_PROJECT;
    const exitSpy = spyOnProcessExit();
    resolveProjectArg();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("falls back to env var when argument is empty string", () => {
    process.env.BACKLOG_PROJECT = "ENV_PROJECT";
    expect(resolveProjectArg("")).toBe("ENV_PROJECT");
  });
});

describe("resolveByName", () => {
  it("finds item by name and returns its ID", async () => {
    const client = createMockClient({
      "/items": [
        { id: 1, name: "Alpha" },
        { id: 2, name: "Beta" },
      ],
    });

    const id = await resolveByName<"name", { id: number; name: string }>(
      client,
      "/items",
      "name",
      "Beta",
      "Item",
    );
    expect(id).toBe(2);
  });

  it("throws with available names when item not found", async () => {
    const client = createMockClient({
      "/items": [
        { id: 1, name: "Alpha" },
        { id: 2, name: "Beta" },
      ],
    });

    await expect(
      resolveByName<"name", { id: number; name: string }>(
        client,
        "/items",
        "name",
        "Gamma",
        "Item",
      ),
    ).rejects.toThrow('Item "Gamma" not found. Available: Alpha, Beta');
  });

  it("throws with empty Available for empty list", async () => {
    const client = createMockClient({ "/items": [] });

    await expect(
      resolveByName<"name", { id: number; name: string }>(client, "/items", "name", "X", "Item"),
    ).rejects.toThrow('Item "X" not found. Available: ');
  });
});

describe("extractProjectKey", () => {
  it("extracts project key from issue key", () => {
    expect(extractProjectKey("PROJECT-123")).toBe("PROJECT");
  });

  it("handles multi-word project key", () => {
    expect(extractProjectKey("MY_PROJECT-1")).toBe("MY_PROJECT");
  });

  it("handles project key with numbers", () => {
    expect(extractProjectKey("PROJ01-42")).toBe("PROJ01");
  });

  it("throws for invalid issue key format", () => {
    expect(() => extractProjectKey("invalid")).toThrow('Invalid issue key format: "invalid"');
  });

  it("throws for lowercase project key", () => {
    expect(() => extractProjectKey("project-123")).toThrow(
      'Invalid issue key format: "project-123"',
    );
  });

  it("throws for missing number part", () => {
    expect(() => extractProjectKey("PROJECT-")).toThrow("Invalid issue key format");
  });
});

describe("resolveProjectId", () => {
  it("returns project ID for a given key", async () => {
    const client = createMockClient({
      "/projects/PROJ": { id: 42, projectKey: "PROJ" },
    });

    const id = await resolveProjectId(client, "PROJ");
    expect(id).toBe(42);
  });
});

describe("resolveUserId", () => {
  it("returns current user ID for @me", async () => {
    const client = createMockClient({
      "/users/myself": { id: 1, userId: "me", name: "Me" },
    });

    const id = await resolveUserId(client, "@me");
    expect(id).toBe(1);
  });

  it("finds user by userId", async () => {
    const client = createMockClient({
      "/users": [
        { id: 10, userId: "taro", name: "Taro Yamada" },
        { id: 20, userId: "hanako", name: "Hanako Sato" },
      ],
    });

    const id = await resolveUserId(client, "taro");
    expect(id).toBe(10);
  });

  it("finds user by name", async () => {
    const client = createMockClient({
      "/users": [{ id: 10, userId: "taro", name: "Taro Yamada" }],
    });

    const id = await resolveUserId(client, "Taro Yamada");
    expect(id).toBe(10);
  });

  it("throws when user not found", async () => {
    const client = createMockClient({ "/users": [] });

    await expect(resolveUserId(client, "unknown")).rejects.toThrow('User "unknown" not found');
  });
});

describe("resolvePriorityId", () => {
  const client = createMockClient({
    "/priorities": [
      { id: 2, name: "High" },
      { id: 3, name: "Normal" },
      { id: 4, name: "Low" },
    ],
  });

  it("returns priority ID by name", async () => {
    expect(await resolvePriorityId(client, "High")).toBe(2);
    expect(await resolvePriorityId(client, "Normal")).toBe(3);
  });

  it("throws when priority not found", async () => {
    await expect(resolvePriorityId(client, "Critical")).rejects.toThrow(
      'Priority "Critical" not found. Available: High, Normal, Low',
    );
  });
});

describe("resolveStatusId", () => {
  const client = createMockClient({
    "/projects/PROJ/statuses": [
      { id: 1, name: "Open" },
      { id: 2, name: "In Progress" },
      { id: 4, name: "Closed" },
    ],
  });

  it("returns status ID by name", async () => {
    expect(await resolveStatusId(client, "PROJ", "Open")).toBe(1);
  });

  it("throws when status not found", async () => {
    await expect(resolveStatusId(client, "PROJ", "Unknown")).rejects.toThrow(
      'Status "Unknown" not found in project PROJ. Available: Open, In Progress, Closed',
    );
  });
});

describe("resolveClosedStatusId", () => {
  it("returns status with id 4 (completed)", async () => {
    const client = createMockClient({
      "/projects/PROJ/statuses": [
        { id: 1, name: "Open" },
        { id: 4, name: "Closed" },
      ],
    });

    expect(await resolveClosedStatusId(client, "PROJ")).toBe(4);
  });

  it("falls back to last status if id 4 not found", async () => {
    const client = createMockClient({
      "/projects/PROJ/statuses": [
        { id: 1, name: "Open" },
        { id: 5, name: "Done" },
      ],
    });

    expect(await resolveClosedStatusId(client, "PROJ")).toBe(5);
  });

  it("throws when no statuses exist", async () => {
    const client = createMockClient({
      "/projects/PROJ/statuses": [],
    });

    await expect(resolveClosedStatusId(client, "PROJ")).rejects.toThrow(
      "No statuses found for project PROJ",
    );
  });
});

describe("resolveOpenStatusId", () => {
  it("returns status with id 1 (open)", async () => {
    const client = createMockClient({
      "/projects/PROJ/statuses": [
        { id: 1, name: "Open" },
        { id: 4, name: "Closed" },
      ],
    });

    expect(await resolveOpenStatusId(client, "PROJ")).toBe(1);
  });

  it("falls back to first status if id 1 not found", async () => {
    const client = createMockClient({
      "/projects/PROJ/statuses": [
        { id: 2, name: "Custom Open" },
        { id: 5, name: "Done" },
      ],
    });

    expect(await resolveOpenStatusId(client, "PROJ")).toBe(2);
  });

  it("throws when no statuses exist", async () => {
    const client = createMockClient({
      "/projects/PROJ/statuses": [],
    });

    await expect(resolveOpenStatusId(client, "PROJ")).rejects.toThrow(
      "No statuses found for project PROJ",
    );
  });
});

describe("resolveIssueTypeId", () => {
  const client = createMockClient({
    "/projects/PROJ/issueTypes": [
      { id: 100, name: "Bug" },
      { id: 101, name: "Task" },
    ],
  });

  it("returns issue type ID by name", async () => {
    expect(await resolveIssueTypeId(client, "PROJ", "Bug")).toBe(100);
  });

  it("throws when issue type not found", async () => {
    await expect(resolveIssueTypeId(client, "PROJ", "Story")).rejects.toThrow(
      'Issue type "Story" not found in project PROJ. Available: Bug, Task',
    );
  });
});

describe("resolveResolutionId", () => {
  const client = createMockClient({
    "/resolutions": [
      { id: 0, name: "Fixed" },
      { id: 1, name: "Won't Fix" },
      { id: 2, name: "Duplicate" },
    ],
  });

  it("returns resolution ID by name", async () => {
    expect(await resolveResolutionId(client, "Fixed")).toBe(0);
  });

  it("throws when resolution not found", async () => {
    await expect(resolveResolutionId(client, "Invalid")).rejects.toThrow(
      'Resolution "Invalid" not found. Available: Fixed, Won\'t Fix, Duplicate',
    );
  });
});
