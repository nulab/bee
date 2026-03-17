import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getWikisCount: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

describe("wiki count", () => {
  it("displays wiki page count", async () => {
    mockClient.getWikisCount.mockResolvedValue({ count: 42 });

    await parseCommand(() => import("./count"), ["-p", "TEST"]);

    expect(mockClient.getWikisCount).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith("42");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./count"),
      ["-p", "TEST", "--json"],
      "42",
      () => {
        mockClient.getWikisCount.mockResolvedValue({ count: 42 });
      },
    ),
  );
});
