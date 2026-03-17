import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getWikis: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
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

    await parseCommand(() => import("./list"), ["-p", "TEST"]);

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

    await parseCommand(() => import("./list"), ["-p", "TEST"]);

    expect(consola.info).toHaveBeenCalledWith("No wiki pages found.");
  });

  it("passes keyword parameter", async () => {
    mockClient.getWikis.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["-p", "TEST", "--keyword", "setup"]);

    expect(mockClient.getWikis).toHaveBeenCalledWith({
      projectIdOrKey: "TEST",
      keyword: "setup",
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["-p", "TEST", "--json"],
      "Home",
      () => {
        mockClient.getWikis.mockResolvedValue([
          { id: 1, name: "Home", updated: "2025-01-01T00:00:00Z" },
        ]);
      },
    ),
  );
});
