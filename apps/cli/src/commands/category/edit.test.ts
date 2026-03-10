import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ patchCategories: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category edit", () => {
  it("updates category name", async () => {
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "New Name" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "New Name"]);

    expect(mockClient.patchCategories).toHaveBeenCalledWith("TEST", 1, { name: "New Name" });
    expect(consola.success).toHaveBeenCalledWith("Updated category New Name (ID: 1)");
  });

  it("sends exact default payload (no extra fields)", async () => {
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "Name" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "Name"]);

    const callArgs = mockClient.patchCategories.mock.calls[0];
    expect(callArgs[0]).toBe("TEST");
    expect(callArgs[1]).toBe(1);
    expect(callArgs[2]).toEqual({
      name: "Name",
    });
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Prompted Name");
    mockClient.patchCategories.mockResolvedValue({ id: 1, name: "Prompted Name" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST"]);

    expect(promptRequired).toHaveBeenCalledWith("Category name:", undefined);
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["1", "-p", "TEST", "-n", "Name", "--json"],
      "Name",
      () => mockClient.patchCategories.mockResolvedValue({ id: 1, name: "Name" }),
    ),
  );
});
