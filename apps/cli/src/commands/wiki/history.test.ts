import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWikisHistory: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki history", () => {
  it("displays wiki page history", async () => {
    mockClient.getWikisHistory.mockResolvedValue([
      { version: 3, createdUser: { name: "Alice" }, created: "2025-01-03T00:00:00Z" },
      { version: 2, createdUser: { name: "Bob" }, created: "2025-01-02T00:00:00Z" },
    ]);

    const { default: history } = await import("./history");
    await history.parseAsync(["123"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWikisHistory).toHaveBeenCalledWith(123, {
      minId: undefined,
      maxId: undefined,
      count: undefined,
      order: undefined,
    });
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("VERSION"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
  });

  it("shows message when no history found", async () => {
    mockClient.getWikisHistory.mockResolvedValue([]);

    const { default: history } = await import("./history");
    await history.parseAsync(["123"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No history found.");
  });

  it("passes order parameter", async () => {
    mockClient.getWikisHistory.mockResolvedValue([]);

    const { default: history } = await import("./history");
    await history.parseAsync(["123", "--order", "asc"], { from: "user" });

    expect(mockClient.getWikisHistory).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ order: "asc" }),
    );
  });

  it("passes count and ID range parameters", async () => {
    mockClient.getWikisHistory.mockResolvedValue([]);

    const { default: history } = await import("./history");
    await history.parseAsync(["123", "--count", "10", "--min-id", "1", "--max-id", "5"], {
      from: "user",
    });

    expect(mockClient.getWikisHistory).toHaveBeenCalledWith(123, {
      minId: 1,
      maxId: 5,
      count: 10,
      order: undefined,
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWikisHistory.mockResolvedValue([
      { version: 1, createdUser: { name: "Alice" }, created: "2025-01-01T00:00:00Z" },
    ]);

    await expectStdoutContaining(async () => {
      const { default: history } = await import("./history");
      await history.parseAsync(["123", "--json"], { from: "user" });
    }, "Alice");
  });
});
