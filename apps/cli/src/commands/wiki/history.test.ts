import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

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

    const { history } = await import("./history");
    await history.run?.({ args: { wiki: "123" } } as never);

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

    const { history } = await import("./history");
    await history.run?.({ args: { wiki: "123" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No history found.");
  });

  it("passes order parameter", async () => {
    mockClient.getWikisHistory.mockResolvedValue([]);

    const { history } = await import("./history");
    await history.run?.({ args: { wiki: "123", order: "asc" } } as never);

    expect(mockClient.getWikisHistory).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ order: "asc" }),
    );
  });

  it("passes count and ID range parameters", async () => {
    mockClient.getWikisHistory.mockResolvedValue([]);

    const { history } = await import("./history");
    await history.run?.({
      args: { wiki: "123", count: "10", "min-id": "1", "max-id": "5" },
    } as never);

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

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { history } = await import("./history");
    await history.run?.({ args: { wiki: "123", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    writeSpy.mockRestore();
  });
});
