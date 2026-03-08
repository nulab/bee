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
    const { remove } = await import("./remove");
    await remove.run?.({ args: { star: "12345" } } as never);
    expect(mockClient.removeStar).toHaveBeenCalledWith(12_345);
    expect(consola.success).toHaveBeenCalledWith("Removed star 12345.");
  });
});
