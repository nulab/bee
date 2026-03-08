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

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getCategories).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Feature"));
  });

  it("shows message when no categories found", async () => {
    mockClient.getCategories.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No categories found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getCategories.mockResolvedValue(sampleCategories);

    await expectStdoutContaining(async () => {
      const { list } = await import("./list");
      await list.run?.({ args: { project: "TEST", json: "" } } as never);
    }, "Bug");
  });

  it("propagates API errors", async () => {
    mockClient.getCategories.mockRejectedValue(new Error("Not Found"));

    const { list } = await import("./list");
    await expect(list.run?.({ args: { project: "TEST" } } as never)).rejects.toThrow("Not Found");
  });
});
