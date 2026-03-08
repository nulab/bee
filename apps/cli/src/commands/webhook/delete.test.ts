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
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("webhook delete", () => {
  it("deletes webhook after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWebhook.mockResolvedValue({ id: 1, name: "Deploy Hook" });

    const { deleteWebhook } = await import("./delete");
    await deleteWebhook.run?.({ args: { webhook: "1", project: "TEST" } } as never);

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

    const { deleteWebhook } = await import("./delete");
    await deleteWebhook.run?.({ args: { webhook: "1", project: "TEST", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteWebhook } = await import("./delete");
    await deleteWebhook.run?.({ args: { webhook: "1", project: "TEST" } } as never);

    expect(mockClient.deleteWebhook).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWebhook.mockResolvedValue({ id: 1, name: "Deploy Hook" });

    await expectStdoutContaining(async () => {
      const { deleteWebhook } = await import("./delete");
      await deleteWebhook.run?.({
        args: { webhook: "1", project: "TEST", yes: true, json: "" },
      } as never);
    }, "Deploy Hook");
  });
});
