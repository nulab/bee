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

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

describe("wiki list", () => {
  it("displays wiki pages in tabular format", async () => {
    mockClient.getWikis.mockResolvedValue([
      { id: 1, name: "Home", updated: "2025-01-01T00:00:00Z" },
      { id: 2, name: "Setup Guide", updated: "2025-01-02T00:00:00Z" },
    ]);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

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

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No wiki pages found.");
  });

  it("passes keyword parameter", async () => {
    mockClient.getWikis.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST", "--keyword", "setup"], { from: "user" });

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
      const { default: list } = await import("./list");
      await list.parseAsync(["TEST", "--json"], { from: "user" });
    }, "Home");
  });
});
