import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteProjectStatus: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("status delete", () => {
  it("deletes status after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    await parseCommand(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-status-id", "2"],
    );

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete status 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteProjectStatus).toHaveBeenCalledWith("TEST", 1, 2);
    expect(consola.success).toHaveBeenCalledWith("Deleted status Open (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    await parseCommand(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-status-id", "2", "--yes"],
    );

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete status 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-status-id", "2"],
    );

    expect(mockClient.deleteProjectStatus).not.toHaveBeenCalled();
  });

  it("propagates API error", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProjectStatus.mockRejectedValue(new Error("Not Found"));

    await expect(
      parseCommand(
        () => import("./delete"),
        ["1", "-p", "TEST", "--substitute-status-id", "2", "--yes"],
      ),
    ).rejects.toThrow("Not Found");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-status-id", "2", "--yes", "--json"],
      "Open",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });
      },
    ),
  );
});
