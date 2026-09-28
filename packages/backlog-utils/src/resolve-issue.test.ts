import { type Backlog } from "backlog-js";
import { describe, expect, it, vi } from "vite-plus/test";
import { resolveIssueId } from "./resolve-issue";

const createMockClient = () =>
  ({
    getIssue: vi.fn().mockResolvedValue({ id: 4531, issueKey: "PROJ-17" }),
  }) as unknown as Backlog & { getIssue: ReturnType<typeof vi.fn> };

describe("resolveIssueId", () => {
  it("uses a numeric issue ID without an API call", async () => {
    const client = createMockClient();
    await expect(resolveIssueId(client, "4531")).resolves.toBe(4531);
    expect(client.getIssue).not.toHaveBeenCalled();
  });

  it("looks up values that only look numeric, such as 1e3", async () => {
    const client = createMockClient();
    await resolveIssueId(client, "1e3");
    expect(client.getIssue).toHaveBeenCalledWith("1e3");
  });

  it("looks up the ID of an issue key", async () => {
    const client = createMockClient();
    await expect(resolveIssueId(client, "PROJ-17")).resolves.toBe(4531);
    expect(client.getIssue).toHaveBeenCalledWith("PROJ-17");
  });
});
