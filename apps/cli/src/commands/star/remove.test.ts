import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  removeStar: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("star remove", () => {
  it("removes a star by ID", async () => {
    mockClient.removeStar.mockResolvedValue(undefined);
    const { default: remove } = await import("./remove");
    await remove.parseAsync(["12345"], { from: "user" });
    expect(mockClient.removeStar).toHaveBeenCalledWith(12_345);
    expect(consola.success).toHaveBeenCalledWith("Removed star 12345.");
  });

  it("converts string ID to number", async () => {
    mockClient.removeStar.mockResolvedValue(undefined);
    const { default: remove } = await import("./remove");
    await remove.parseAsync(["7"], { from: "user" });
    expect(mockClient.removeStar).toHaveBeenCalledWith(7);
  });
});
