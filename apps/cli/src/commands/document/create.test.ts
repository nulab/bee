import { promptRequired, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  addDocument: vi.fn(),
  getProjects: vi.fn().mockResolvedValue([{ id: 100, projectKey: "PROJECT" }]),
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

describe("document create", () => {
  it("creates a document with provided fields", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Meeting Notes");
    mockClient.addDocument.mockResolvedValue({
      id: "1",
      title: "Meeting Notes",
    });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "100", "-t", "Meeting Notes", "-b", "Content here"], {
      from: "user",
    });

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

    const { default: create } = await import("./create");
    await create.parseAsync([], { from: "user" });

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

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "100", "-t", "Title", "-b", ""], { from: "user" });

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

    const { default: create } = await import("./create");
    await create.parseAsync(
      ["-p", "100", "-t", "Title", "--emoji", "star", "--parent-id", "999", "--add-last"],
      { from: "user" },
    );

    expect(mockClient.addDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: "star",
        parentId: "999",
        addLast: true,
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("100").mockResolvedValueOnce("Title");
    mockClient.addDocument.mockResolvedValue({
      id: "5",
      title: "Title",
    });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(["-p", "100", "-t", "Title", "--json"], { from: "user" });
    }, "Title");
  });
});
