import { promptRequired, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  postWiki: vi.fn(),
  getProjects: vi.fn(),
});

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki create", () => {
  it("creates a wiki page with provided arguments", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    await parseCommand(() => import("./create"), ["-p", "TEST", "-n", "My Page", "-b", "Hello"]);

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

    await parseCommand(() => import("./create"), ["-p", "TEST", "-n", "My Page", "-b", ""]);

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

    await parseCommand(() => import("./create"), []);

    expect(promptRequired).toHaveBeenCalledWith("Project:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Page name:", undefined);
  });

  it("passes notify flag", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
    mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
    mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });

    await parseCommand(
      () => import("./create"),
      ["-p", "TEST", "-n", "My Page", "-b", "Hello", "--mail-notify"],
    );

    expect(mockClient.postWiki).toHaveBeenCalledWith(expect.objectContaining({ mailNotify: true }));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["-p", "TEST", "-n", "My Page", "-b", "Hello", "--json"],
      "My Page",
      () => {
        vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("My Page");
        mockClient.getProjects.mockResolvedValue([{ id: 100, projectKey: "TEST" }]);
        mockClient.postWiki.mockResolvedValue({ id: 1, name: "My Page" });
      },
    ),
  );
});
