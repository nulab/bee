import { type Backlog } from "backlog-js";
import { describe, expect, it, vi } from "vitest";
import { resolveStatusId } from "./resolve-status";

const createMockClient = (statuses: { id: number; name: string }[] = []) =>
  ({
    getProjectStatuses: vi.fn().mockResolvedValue(statuses),
  }) as unknown as Backlog;

describe("resolveStatusId", () => {
  it("returns numeric ID as-is", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "3")).toBe(3);
    expect(client.getProjectStatuses).not.toHaveBeenCalled();
  });

  it("resolves built-in status name 'open'", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "open")).toBe(1);
  });

  it("resolves built-in status name 'in-progress'", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "in-progress")).toBe(2);
  });

  it("resolves built-in status name 'inprogress'", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "inprogress")).toBe(2);
  });

  it("resolves built-in status name 'resolved'", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "resolved")).toBe(3);
  });

  it("resolves built-in status name 'closed'", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "closed")).toBe(4);
  });

  it("is case-insensitive for built-in names", async () => {
    const client = createMockClient();
    expect(await resolveStatusId(client, "Open")).toBe(1);
    expect(await resolveStatusId(client, "CLOSED")).toBe(4);
    expect(await resolveStatusId(client, "In-Progress")).toBe(2);
  });

  it("resolves custom project status by name", async () => {
    const client = createMockClient([
      { id: 1, name: "Open" },
      { id: 2, name: "In Progress" },
      { id: 1000, name: "Reviewing" },
    ]);
    expect(await resolveStatusId(client, "Reviewing", "PROJECT")).toBe(1000);
    expect(client.getProjectStatuses).toHaveBeenCalledWith("PROJECT");
  });

  it("is case-insensitive for custom status names", async () => {
    const client = createMockClient([{ id: 1000, name: "Reviewing" }]);
    expect(await resolveStatusId(client, "reviewing", "PROJECT")).toBe(1000);
  });

  it("throws for unknown status without project", async () => {
    const client = createMockClient();
    await expect(resolveStatusId(client, "unknown")).rejects.toThrow(
      'Unknown status "unknown". Built-in values: open, in-progress, resolved, closed',
    );
  });

  it("throws for unknown status with project", async () => {
    const client = createMockClient([{ id: 1, name: "Open" }]);
    await expect(resolveStatusId(client, "unknown", "PROJECT")).rejects.toThrow(
      "No matching custom status found in the project either",
    );
  });
});
