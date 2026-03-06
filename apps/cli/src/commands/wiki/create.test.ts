import { promptRequired, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postWiki: vi.fn(),
  getProjects: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/backlog-utils")>()),
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

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST", name: "My Page", body: "Hello" } } as never);

    expect(mockClient.postWiki).toHaveBeenCalledWith({
      projectId: 100,
      name: "My Page",
      content: "Hello",
      mailNotify: undefined,
    });
    expect(consola.success).toHaveBeenCalledWith("Created wiki page 1: My Page");
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST", name: "My Page", body: "" } } as never);

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

    const { create } = await import("./create");
    await create.run?.({ args: {} } as never);

    expect(promptRequired).toHaveBeenCalledWith("Project:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Page name:", undefined);
  });

  it("passes notify flag", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "TEST", name: "My Page", body: "Hello", "mail-notify": true },
    } as never);

    expect(mockClient.postWiki).toHaveBeenCalledWith(expect.objectContaining({ mailNotify: true }));
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "TEST", name: "My Page", body: "Hello", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("My Page"));
    writeSpy.mockRestore();
  });
});
