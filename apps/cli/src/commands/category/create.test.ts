import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ postCategories: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category create", () => {
  it("creates a category with provided name", async () => {
    mockClient.postCategories.mockResolvedValue({ id: 1, name: "Bug Report", projectId: 100 });
    await parseCommand(() => import("./create"), ["-p", "TEST", "-n", "Bug Report"]);

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

    await parseCommand(() => import("./create"), ["-p", "TEST"]);

    expect(promptRequired).toHaveBeenCalledWith("Category name:", undefined);
    expect(mockClient.postCategories).toHaveBeenCalledWith("TEST", { name: "Prompted Category" });
  });

  it("propagates API error", async () => {
    mockClient.postCategories.mockRejectedValue(new Error("API error"));

    await expect(
      parseCommand(() => import("./create"), ["-p", "TEST", "-n", "Bug"]),
    ).rejects.toThrow("API error");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["-p", "TEST", "-n", "Bug", "--json"],
      "Bug",
      () => {
        mockClient.postCategories.mockResolvedValue({ id: 1, name: "Bug", projectId: 100 });
      },
    ),
  );
});
