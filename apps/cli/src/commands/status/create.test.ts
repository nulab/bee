import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ postProjectStatus: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("status create", () => {
  it("creates a status with provided name and color", async () => {
    mockClient.postProjectStatus.mockResolvedValue({ id: 1, name: "In Review", color: "#2779ca" });

    await parseCommand(
      () => import("./create"),
      ["-p", "TEST", "-n", "In Review", "--color", "#2779ca"],
    );

    expect(mockClient.postProjectStatus).toHaveBeenCalledWith("TEST", {
      name: "In Review",
      color: "#2779ca",
    });
    expect(consola.success).toHaveBeenCalledWith("Created status In Review (ID: 1)");
    expect(consola.info).toHaveBeenCalledWith(
      "https://example.backlog.com/projects/TEST/statuses/1",
    );
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("TEST")
      .mockResolvedValueOnce("Prompted Status");
    mockClient.postProjectStatus.mockResolvedValue({
      id: 2,
      name: "Prompted Status",
      color: "#2779ca",
    });

    await parseCommand(() => import("./create"), ["-p", "TEST", "--color", "#2779ca"]);

    expect(promptRequired).toHaveBeenCalledWith("Status name:", undefined);
  });

  it("propagates API error", async () => {
    mockClient.postProjectStatus.mockRejectedValue(new Error("API error"));

    await expect(
      parseCommand(() => import("./create"), ["-p", "TEST", "-n", "Open", "--color", "#e30000"]),
    ).rejects.toThrow("API error");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["-p", "TEST", "-n", "Open", "--color", "#e30000", "--json"],
      "Open",
      () => {
        mockClient.postProjectStatus.mockResolvedValue({
          id: 1,
          name: "Open",
          color: "#e30000",
        });
      },
    ),
  );
});
