import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteProject: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project delete", () => {
  it("deletes project after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProject.mockResolvedValue({ projectKey: "TEST", name: "Test Project" });

    await parseCommand(() => import("./delete"), ["-p", "TEST"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete project TEST? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteProject).toHaveBeenCalledWith("TEST");
    expect(consola.success).toHaveBeenCalledWith("Deleted project TEST: Test Project");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProject.mockResolvedValue({ projectKey: "TEST", name: "Test Project" });

    await parseCommand(() => import("./delete"), ["-p", "TEST", "--yes"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete project TEST? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(() => import("./delete"), ["-p", "TEST"]);

    expect(mockClient.deleteProject).not.toHaveBeenCalled();
  });
  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["-p", "TEST", "--yes", "--json"],
      "TEST",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteProject.mockResolvedValue({ projectKey: "TEST", name: "Test Project" });
      },
    ),
  );
});
