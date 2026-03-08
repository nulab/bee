import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getCategories: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleCategories = [
  { id: 1, name: "Bug", displayOrder: 0 },
  { id: 2, name: "Feature", displayOrder: 1 },
];

describe("category list", () => {
  it("displays category list in tabular format", async () => {
    mockClient.getCategories.mockResolvedValue(sampleCategories);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getCategories).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Feature"));
  });

  it("shows message when no categories found", async () => {
    mockClient.getCategories.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No categories found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getCategories.mockResolvedValue(sampleCategories);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["TEST", "--json"], { from: "user" });
    }, "Bug");
  });
});
