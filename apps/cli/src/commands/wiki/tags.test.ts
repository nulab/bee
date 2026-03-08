import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWikisTags: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

describe("wiki tags", () => {
  it("displays wiki tags", async () => {
    mockClient.getWikisTags.mockResolvedValue([
      { id: 1, name: "guide" },
      { id: 2, name: "setup" },
    ]);

    const { default: tags } = await import("./tags");
    await tags.parseAsync(["-p", "TEST"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWikisTags).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith("guide");
    expect(consola.log).toHaveBeenCalledWith("setup");
  });

  it("shows message when no tags found", async () => {
    mockClient.getWikisTags.mockResolvedValue([]);

    const { default: tags } = await import("./tags");
    await tags.parseAsync(["-p", "TEST"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No wiki tags found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWikisTags.mockResolvedValue([{ id: 1, name: "guide" }]);

    await expectStdoutContaining(async () => {
      const { default: tags } = await import("./tags");
      await tags.parseAsync(["-p", "TEST", "--json"], { from: "user" });
    }, "guide");
  });
});
