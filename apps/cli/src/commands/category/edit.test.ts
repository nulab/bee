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
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category edit", () => {
  it("updates category name", async () => {
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "New Name" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST", "-n", "New Name"], { from: "user" });

    expect(mockClient.patchCategories).toHaveBeenCalledWith("TEST", 1, { name: "New Name" });
    expect(consola.success).toHaveBeenCalledWith("Updated category New Name (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Prompted Name");
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "Prompted Name" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST"], { from: "user" });

    expect(promptRequired).toHaveBeenCalledWith("Category name:", undefined);
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "Name" });

    await expectStdoutContaining(async () => {
      const { default: edit } = await import("./edit");
      await edit.parseAsync(["1", "-p", "TEST", "-n", "Name", "--json"], { from: "user" });
    }, "Name");
  });
});
