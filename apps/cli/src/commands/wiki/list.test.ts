import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWikis: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki list", () => {
  it("displays wiki pages in tabular format", async () => {
    mockClient.getWikis.mockResolvedValue([
      { id: 1, name: "Home", updated: "2025-01-01T00:00:00Z" },
      { id: 2, name: "Setup Guide", updated: "2025-01-02T00:00:00Z" },
    ]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWikis).toHaveBeenCalledWith({
      projectIdOrKey: "TEST",
      keyword: undefined,
    });
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Home"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Setup Guide"));
  });

  it("shows message when no wiki pages found", async () => {
    mockClient.getWikis.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No wiki pages found.");
  });

  it("passes keyword parameter", async () => {
    mockClient.getWikis.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST", keyword: "setup" } } as never);

    expect(mockClient.getWikis).toHaveBeenCalledWith({
      projectIdOrKey: "TEST",
      keyword: "setup",
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWikis.mockResolvedValue([
      { id: 1, name: "Home", updated: "2025-01-01T00:00:00Z" },
    ]);

    await expectStdoutContaining(async () => {
      const { list } = await import("./list");
      await list.run?.({ args: { project: "TEST", json: "" } } as never);
    }, "Home");
  });

  it("propagates API errors", async () => {
    mockClient.getWikis.mockRejectedValue(new Error("Forbidden"));

    const { list } = await import("./list");
    await expect(list.run?.({ args: { project: "TEST" } } as never)).rejects.toThrow("Forbidden");
  });
});
