import { type Backlog } from "backlog-js";
import { describe, expect, it, vi } from "vitest";
import { resolveStatusId } from "./resolve-status";

const createMockClient = (statuses: { id: number; name: string }[] = []) =>
  ({
    getProjectStatuses: vi.fn().mockResolvedValue(statuses),
  }) as unknown as Backlog;

describe("resolveStatusId", () => {
  it("returns numeric ID as-is without calling API", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "3", "PROJECT")).toBe(3);
    expect(client.getProjectStatuses).not.toHaveBeenCalled();
  });

  it("resolves status name via project API (English)", async () => {
    const client = createMockClient([
      { id: 1, name: "Open" },
      { id: 2, name: "In Progress" },
      { id: 3, name: "Resolved" },
      { id: 4, name: "Closed" },
    ]);
    expect(await resolveStatusId(client, "Open", "PROJECT")).toBe(1);
    expect(await resolveStatusId(client, "Closed", "PROJECT")).toBe(4);
    expect(client.getProjectStatuses).toHaveBeenCalledWith("PROJECT");
  });

  it("resolves status name via project API (Japanese)", async () => {
    const client = createMockClient([
      { id: 1, name: "未着手" },
      { id: 2, name: "処理中" },
      { id: 3, name: "処理済み" },
      { id: 4, name: "完了" },
    ]);
    expect(await resolveStatusId(client, "未着手", "PROJECT")).toBe(1);
    expect(await resolveStatusId(client, "完了", "PROJECT")).toBe(4);
  });

  it("is case-insensitive for name matching", async () => {
    const client = createMockClient([
      { id: 1, name: "Open" },
      { id: 4, name: "Closed" },
    ]);
    expect(await resolveStatusId(client, "open", "PROJECT")).toBe(1);
    expect(await resolveStatusId(client, "CLOSED", "PROJECT")).toBe(4);
  });

  it("resolves custom project status by name", async () => {
    const client = createMockClient([
      { id: 1, name: "Open" },
      { id: 1000, name: "Reviewing" },
    ]);
    expect(await resolveStatusId(client, "Reviewing", "PROJECT")).toBe(1000);
  });

  it("throws with available statuses when name not found", async () => {
    const client = createMockClient([
      { id: 1, name: "Open" },
      { id: 4, name: "Closed" },
    ]);
    await expect(resolveStatusId(client, "unknown", "PROJECT")).rejects.toThrow(
      'Unknown status "unknown". Available statuses: Open, Closed',
    );
  });
});
