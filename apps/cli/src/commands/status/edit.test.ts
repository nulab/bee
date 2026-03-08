import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchProjectStatus: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("status edit", () => {
  it("updates status name", async () => {
    mockClient.patchProjectStatus.mockResolvedValue({ id: 1, name: "New Name", color: "#e30000" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST", "-n", "New Name"], { from: "user" });

    expect(mockClient.patchProjectStatus).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated status New Name (ID: 1)");
  });

  it("updates status color", async () => {
    mockClient.patchProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST", "--color", "#e30000"], { from: "user" });

    expect(mockClient.patchProjectStatus).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ color: "#e30000" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    await expectStdoutContaining(async () => {
      const { default: edit } = await import("./edit");
      await edit.parseAsync(["1", "-p", "TEST", "-n", "Open", "--json"], { from: "user" });
    }, "Open");
  });
});
