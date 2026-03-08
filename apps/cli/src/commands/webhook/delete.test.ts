import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteWebhook: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("webhook delete", () => {
  it("deletes webhook after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWebhook.mockResolvedValue({ id: 1, name: "Deploy Hook" });

    const { default: deleteWebhook } = await import("./delete");
    await deleteWebhook.parseAsync(["1", "-p", "TEST"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete webhook 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteWebhook).toHaveBeenCalledWith("TEST", "1");
    expect(consola.success).toHaveBeenCalledWith("Deleted webhook Deploy Hook (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWebhook.mockResolvedValue({ id: 1, name: "Deploy Hook" });

    const { default: deleteWebhook } = await import("./delete");
    await deleteWebhook.parseAsync(["1", "-p", "TEST", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete webhook 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteWebhook } = await import("./delete");
    await deleteWebhook.parseAsync(["1", "-p", "TEST"], { from: "user" });

    expect(mockClient.deleteWebhook).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWebhook.mockResolvedValue({ id: 1, name: "Deploy Hook" });

    await expectStdoutContaining(async () => {
      const { default: deleteWebhook } = await import("./delete");
      await deleteWebhook.parseAsync(["1", "-p", "TEST", "--yes", "--json"], { from: "user" });
    }, "Deploy Hook");
  });
});
