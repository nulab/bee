import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteProject: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
  promptRequired: vi.fn((label: string, value: unknown) => Promise.resolve(value)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project delete", () => {
  it("deletes project after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProject.mockResolvedValue({ projectKey: "TEST", name: "Test Project" });

    const { default: deleteProject } = await import("./delete");
    await deleteProject.parseAsync(["TEST"], { from: "user" });

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

    const { default: deleteProject } = await import("./delete");
    await deleteProject.parseAsync(["TEST", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete project TEST? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteProject } = await import("./delete");
    await deleteProject.parseAsync(["TEST"], { from: "user" });

    expect(mockClient.deleteProject).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProject.mockResolvedValue({ projectKey: "TEST", name: "Test Project" });

    await expectStdoutContaining(async () => {
      const { default: deleteProject } = await import("./delete");
      await deleteProject.parseAsync(["TEST", "--yes", "--json"], { from: "user" });
    }, "TEST");
  });
});
