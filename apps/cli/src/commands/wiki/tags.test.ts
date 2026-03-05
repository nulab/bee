import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getWikisTags: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki tags", () => {
  it("displays wiki tags", async () => {
    mockClient.getWikisTags.mockResolvedValue([
      { id: 1, name: "guide" },
      { id: 2, name: "setup" },
    ]);

    const { tags } = await import("./tags");
    await tags.run?.({ args: { project: "TEST" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWikisTags).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith("guide");
    expect(consola.log).toHaveBeenCalledWith("setup");
  });

  it("shows message when no tags found", async () => {
    mockClient.getWikisTags.mockResolvedValue([]);

    const { tags } = await import("./tags");
    await tags.run?.({ args: { project: "TEST" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No wiki tags found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWikisTags.mockResolvedValue([{ id: 1, name: "guide" }]);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { tags } = await import("./tags");
    await tags.run?.({ args: { project: "TEST", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("guide"));
    writeSpy.mockRestore();
  });
});
