import { describe, expect, it, vi } from "vitest";
import { parseCommand, setupCommandTest } from "./command-test";

describe("setupCommandTest", () => {
  it("returns mockClient with specified methods as vi.fn()", () => {
    const { mockClient } = setupCommandTest({ getIssues: vi.fn() });
    expect(mockClient.getIssues).toBeDefined();
    expect(vi.isMockFunction(mockClient.getIssues)).toBe(true);
  });

  it("includes getMyself and getProjects by default", () => {
    const { mockClient } = setupCommandTest({});
    expect(vi.isMockFunction(mockClient.getMyself)).toBe(true);
    expect(vi.isMockFunction(mockClient.getProjects)).toBe(true);
  });

  it("getMyself returns default user", async () => {
    const { mockClient } = setupCommandTest({});
    const user = await mockClient.getMyself();
    expect(user).toEqual({ id: 99 });
  });

  it("getProjects returns default project", async () => {
    const { mockClient } = setupCommandTest({});
    const projects = await mockClient.getProjects();
    expect(projects).toEqual([{ id: 123, projectKey: "PROJ" }]);
  });

  it("allows overriding default methods", () => {
    const custom = vi.fn().mockResolvedValue({ id: 42 });
    const { mockClient } = setupCommandTest({ getMyself: custom });
    expect(mockClient.getMyself).toBe(custom);
  });

  it("returns host as example.backlog.com", () => {
    const { host } = setupCommandTest({});
    expect(host).toBe("example.backlog.com");
  });
});

describe("parseCommand", () => {
  it("is a function", () => {
    expect(typeof parseCommand).toBe("function");
  });
});
