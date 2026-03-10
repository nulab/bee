import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteWiki: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki delete", () => {
  it("deletes wiki page after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    await parseCommand(() => import("./delete"), ["123"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete wiki page 123? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteWiki).toHaveBeenCalledWith(123, false);
    expect(consola.success).toHaveBeenCalledWith("Deleted wiki page 123: Old Page");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    await parseCommand(() => import("./delete"), ["123", "--yes"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete wiki page 123? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(() => import("./delete"), ["123"]);

    expect(mockClient.deleteWiki).not.toHaveBeenCalled();
  });

  it("passes notify flag to deleteWiki", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    await parseCommand(() => import("./delete"), ["123", "--yes", "--mail-notify"]);

    expect(mockClient.deleteWiki).toHaveBeenCalledWith(123, true);
  });

  it("propagates API error", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockRejectedValue(new Error("Not Found"));

    await expect(parseCommand(() => import("./delete"), ["123", "--yes"])).rejects.toThrow(
      "Not Found",
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["123", "--yes", "--json"],
      "Old Page",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });
      },
    ),
  );
});
