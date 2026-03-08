import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchCategories: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category edit", () => {
  it("updates category name", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("New Name");
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "New Name" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { category: "1", project: "TEST", name: "New Name" } } as never);

    expect(mockClient.patchCategories).toHaveBeenCalledWith("TEST", 1, { name: "New Name" });
    expect(consola.success).toHaveBeenCalledWith("Updated category New Name (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Name");
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "Prompted Name" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { category: "1", project: "TEST" } } as never);

    expect(promptRequired).toHaveBeenCalledWith("Category name:", undefined);
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Name");
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "Name" });

    await expectStdoutContaining(async () => {
      const { edit } = await import("./edit");
      await edit.run?.({
        args: { category: "1", project: "TEST", name: "Name", json: "" },
      } as never);
    }, "Name");
  });
});
