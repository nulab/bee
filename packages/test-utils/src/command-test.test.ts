import { describe, expect, it, vi } from "vitest";
import { mockGetClient, parseCommand, setupCommandTest } from "./command-test";

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

describe("mockGetClient", () => {
  it("returns object with getClient mock", () => {
    const mockClient = { foo: vi.fn() };
    const result = mockGetClient(mockClient);
    expect(vi.isMockFunction(result.getClient)).toBe(true);
  });

  it("getClient resolves with client and host", async () => {
    const mockClient = { foo: vi.fn() };
    const result = mockGetClient(mockClient, "test.backlog.com");
    const { client, host } = await result.getClient();
    expect(client).toBe(mockClient);
    expect(host).toBe("test.backlog.com");
  });
});

describe("parseCommand", () => {
  it("is a function", () => {
    expect(typeof parseCommand).toBe("function");
  });
});
