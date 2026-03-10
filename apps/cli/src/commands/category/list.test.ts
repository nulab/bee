import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getCategories: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleCategories = [
  { id: 1, name: "Bug", displayOrder: 0 },
  { id: 2, name: "Feature", displayOrder: 1 },
];

describe("category list", () => {
  it("displays category list in tabular format", async () => {
    mockClient.getCategories.mockResolvedValue(sampleCategories);
    await parseCommand(() => import("./list"), ["TEST"]);

    expect(mockClient.getCategories).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Feature"));
  });

  it("shows message when no categories found", async () => {
    mockClient.getCategories.mockResolvedValue([]);
    await parseCommand(() => import("./list"), ["TEST"]);

    expect(consola.info).toHaveBeenCalledWith("No categories found.");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["TEST", "--json"],
      "Bug",
      () => {
        mockClient.getCategories.mockResolvedValue(sampleCategories);
      },
    ),
  );
});
