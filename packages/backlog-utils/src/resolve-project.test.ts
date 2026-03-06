import { type Backlog } from "backlog-js";
import { describe, expect, it, vi } from "vitest";
import { resolveProjectIds } from "./resolve-project";

const createMockClient = (projects: { id: number; projectKey: string }[]) =>
  ({
    getProjects: vi.fn().mockResolvedValue(projects),
  }) as unknown as Backlog;

describe("resolveProjectIds", () => {
  const projects = [
    { id: 100, projectKey: "FRONTEND" },
    { id: 200, projectKey: "BACKEND" },
    { id: 300, projectKey: "INFRA" },
  ];

  it("resolves project keys to IDs", async () => {
    const client = createMockClient(projects);
    const result = await resolveProjectIds(client, ["FRONTEND", "BACKEND"]);
    expect(result).toEqual([100, 200]);
  });

  it("resolves numeric string IDs", async () => {
    const client = createMockClient(projects);
    const result = await resolveProjectIds(client, ["100", "300"]);
    expect(result).toEqual([100, 300]);
  });

  it("resolves a mix of keys and IDs", async () => {
    const client = createMockClient(projects);
    const result = await resolveProjectIds(client, ["FRONTEND", "300"]);
    expect(result).toEqual([100, 300]);
  });

  it("falls back to key match when numeric string does not match any ID", async () => {
    const client = createMockClient([...projects, { id: 400, projectKey: "123" }]);
    const result = await resolveProjectIds(client, ["123"]);
    expect(result).toEqual([400]);
  });

  it("throws when a value matches no project", async () => {
    const client = createMockClient(projects);
    await expect(resolveProjectIds(client, ["UNKNOWN"])).rejects.toThrow(
      'Project not found: "UNKNOWN"',
    );
  });

  it("returns empty array without calling API when values is empty", async () => {
    const client = createMockClient(projects);
    const result = await resolveProjectIds(client, []);
    expect(result).toEqual([]);
    expect(client.getProjects).not.toHaveBeenCalled();
  });

  it("calls getProjects only once for multiple values", async () => {
    const client = createMockClient(projects);
    await resolveProjectIds(client, ["FRONTEND", "BACKEND", "INFRA"]);
    expect(client.getProjects).toHaveBeenCalledTimes(1);
  });
});
