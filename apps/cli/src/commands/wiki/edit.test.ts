import { resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ patchWiki: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki edit", () => {
  it("updates wiki page name", async () => {
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "New Name" });

    await parseCommand(() => import("./edit"), ["123", "-n", "New Name"]);

    expect(mockClient.patchWiki).toHaveBeenCalledWith(123, {
      name: "New Name",
      content: undefined,
      mailNotify: undefined,
    });
    expect(consola.success).toHaveBeenCalledWith("Updated wiki page 123: New Name");
  });

  it("updates wiki page body", async () => {
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" });

    await parseCommand(() => import("./edit"), ["123", "-b", "New content"]);

    expect(mockClient.patchWiki).toHaveBeenCalledWith(123, {
      name: undefined,
      content: "New content",
      mailNotify: undefined,
    });
  });

  it("sends exact default payload (no extra fields)", async () => {
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" });

    await parseCommand(() => import("./edit"), ["123"]);

    const callArgs = mockClient.patchWiki.mock.calls[0];
    expect(callArgs[0]).toBe(123);
    expect(callArgs[1]).toEqual({
      name: undefined,
      content: undefined,
      mailNotify: undefined,
    });
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" });

    await parseCommand(() => import("./edit"), ["123", "-b", ""]);

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.patchWiki).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ content: "Stdin content" }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["123", "-n", "Page", "--json"],
      "Page",
      () => mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" }),
    ),
  );
});
