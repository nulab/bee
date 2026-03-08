import { promptRequired, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postWiki: vi.fn(),
  getProjects: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki create", () => {
  it("creates a wiki page with provided arguments", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "-n", "My Page", "-b", "Hello"], { from: "user" });

    expect(mockClient.postWiki).toHaveBeenCalledWith({
      projectId: 100,
      name: "My Page",
      content: "Hello",
      mailNotify: undefined,
    });
    expect(consola.success).toHaveBeenCalledWith("Created wiki page 1: My Page");
    expect(consola.info).toHaveBeenCalledWith("https://example.backlog.com/alias/wiki/1");
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "-n", "My Page", "-b", ""], { from: "user" });

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.postWiki).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Stdin content" }),
    );
  });

  it("prompts for project and name when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("PROMPTED")
      .mockResolvedValueOnce("Prompted Page");
    mockClient.getProjects.mockResolvedValue([{ id: 200, projectKey: "PROMPTED" }]);
    mockClient.postWiki.mockResolvedValue({ id: 2, name: "Prompted Page" });

    const { default: create } = await import("./create");
    await create.parseAsync([], { from: "user" });

    expect(promptRequired).toHaveBeenCalledWith("Project:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Page name:", undefined);
  });

  it("passes notify flag", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "-n", "My Page", "-b", "Hello", "--mail-notify"], {
      from: "user",
    });

    expect(mockClient.postWiki).toHaveBeenCalledWith(expect.objectContaining({ mailNotify: true }));
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(["-p", "TEST", "-n", "My Page", "-b", "Hello", "--json"], {
        from: "user",
      });
    }, "My Page");
  });
});
