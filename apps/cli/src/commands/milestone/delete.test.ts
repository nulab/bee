import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteVersions: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("milestone delete", () => {
  it("deletes milestone after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    await parseCommand(() => import("./delete"), ["1", "-p", "TEST"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete milestone 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteVersions).toHaveBeenCalledWith("TEST", 1);
    expect(consola.success).toHaveBeenCalledWith("Deleted milestone v1.0.0 (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    await parseCommand(() => import("./delete"), ["1", "-p", "TEST", "--yes"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete milestone 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(() => import("./delete"), ["1", "-p", "TEST"]);

    expect(mockClient.deleteVersions).not.toHaveBeenCalled();
  });
  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["1", "-p", "TEST", "--yes", "--json"],
      "v1.0.0",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });
      },
    ),
  );
});
