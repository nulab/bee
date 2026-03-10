import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteDocument: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("document delete", () => {
  it("deletes document after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteDocument.mockResolvedValue({ id: "1", title: "My Doc" });

    await parseCommand(() => import("./delete"), ["12345"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete document 12345? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteDocument).toHaveBeenCalledWith("12345");
    expect(consola.success).toHaveBeenCalledWith("Deleted document My Doc (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteDocument.mockResolvedValue({ id: "1", title: "My Doc" });

    await parseCommand(() => import("./delete"), ["12345", "--yes"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete document 12345? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(() => import("./delete"), ["12345"]);

    expect(mockClient.deleteDocument).not.toHaveBeenCalled();
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["12345", "--yes", "--json"],
      "My Doc",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteDocument.mockResolvedValue({ id: "1", title: "My Doc" });
      },
    ),
  );
});
