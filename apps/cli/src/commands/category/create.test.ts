import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postCategories: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category create", () => {
  it("creates a category with provided name", async () => {
    mockClient.postCategories.mockResolvedValue({ id: 1, name: "Bug Report", projectId: 100 });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "-n", "Bug Report"], { from: "user" });

    expect(mockClient.postCategories).toHaveBeenCalledWith("TEST", { name: "Bug Report" });
    expect(consola.success).toHaveBeenCalledWith("Created category Bug Report (ID: 1)");
    expect(consola.info).toHaveBeenCalledWith(
      "https://example.backlog.com/EditComponent.action?component.id=1&component.projectId=100",
    );
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("TEST")
      .mockResolvedValueOnce("Prompted Category");
    mockClient.postCategories.mockResolvedValue({
      id: 2,
      name: "Prompted Category",
      projectId: 100,
    });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST"], { from: "user" });

    expect(promptRequired).toHaveBeenCalledWith("Category name:", undefined);
    expect(mockClient.postCategories).toHaveBeenCalledWith("TEST", { name: "Prompted Category" });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postCategories.mockResolvedValue({ id: 1, name: "Bug", projectId: 100 });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(["-p", "TEST", "-n", "Bug", "--json"], { from: "user" });
    }, "Bug");
  });
});
