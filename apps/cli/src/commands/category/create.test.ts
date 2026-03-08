import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postCategories: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category create", () => {
  it("creates a category with provided name", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Bug Report");
    mockClient.postCategories.mockResolvedValue({ id: 1, name: "Bug Report" });

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST", name: "Bug Report" } } as never);

    expect(mockClient.postCategories).toHaveBeenCalledWith("TEST", { name: "Bug Report" });
    expect(consola.success).toHaveBeenCalledWith("Created category Bug Report (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Category");
    mockClient.postCategories.mockResolvedValue({ id: 2, name: "Prompted Category" });

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST" } } as never);

    expect(promptRequired).toHaveBeenCalledWith("Category name:", undefined);
    expect(mockClient.postCategories).toHaveBeenCalledWith("TEST", { name: "Prompted Category" });
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Bug");
    mockClient.postCategories.mockResolvedValue({ id: 1, name: "Bug" });

    await expectStdoutContaining(async () => {
      const { create } = await import("./create");
      await create.run?.({ args: { project: "TEST", name: "Bug", json: "" } } as never);
    }, "Bug");
  });
});
