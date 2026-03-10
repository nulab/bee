import { promptRequired, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  addDocument: vi.fn(),
  getProjects: vi.fn().mockResolvedValue([{ id: 100, projectKey: "PROJECT" }]),
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

describe("document create", () => {
  it("creates a document with provided fields", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Meeting Notes");
    mockClient.addDocument.mockResolvedValue({
      id: "1",
      title: "Meeting Notes",
    });

    await parseCommand(
      () => import("./create"),
      ["-p", "100", "-t", "Meeting Notes", "-b", "Content here"],
    );

    expect(mockClient.addDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 100,
        title: "Meeting Notes",
        content: "Content here",
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created document Meeting Notes (ID: 1)");
    expect(consola.info).toHaveBeenCalledWith("https://example.backlog.com/document/100/1");
  });

  it("prompts for required fields when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Title");
    mockClient.addDocument.mockResolvedValue({
      id: "2",
      title: "Title",
    });

    await parseCommand(() => import("./create"), []);

    expect(promptRequired).toHaveBeenCalledWith("Project:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Title:", undefined);
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Title");
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.addDocument.mockResolvedValue({
      id: "3",
      title: "Title",
    });

    await parseCommand(() => import("./create"), ["-p", "100", "-t", "Title", "-b", ""]);

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.addDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Stdin content",
      }),
    );
  });

  it("passes optional fields to API", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Title");
    mockClient.addDocument.mockResolvedValue({
      id: "4",
      title: "Title",
    });

    await parseCommand(
      () => import("./create"),
      ["-p", "100", "-t", "Title", "--emoji", "star", "--parent-id", "999", "--add-last"],
    );

    expect(mockClient.addDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: "star",
        parentId: "999",
        addLast: true,
      }),
    );
  });

  it("propagates API error", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Title");
    mockClient.addDocument.mockRejectedValue(new Error("API error"));

    await expect(
      parseCommand(() => import("./create"), ["-p", "100", "-t", "Title"]),
    ).rejects.toThrow("API error");
  });

  it("sends exact payload with only required fields (no extra fields)", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Title");
    mockClient.addDocument.mockResolvedValue({ id: "10", title: "Title" });

    await parseCommand(() => import("./create"), ["-p", "100", "-t", "Title"]);

    expect(mockClient.addDocument).toHaveBeenCalledWith({
      projectId: 100,
      title: "Title",
      content: undefined,
      emoji: undefined,
      parentId: undefined,
      addLast: undefined,
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["-p", "100", "-t", "Title", "--json"],
      "Title",
      () => {
        vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Title");
        mockClient.addDocument.mockResolvedValue({
          id: "5",
          title: "Title",
        });
      },
    ),
  );
});
