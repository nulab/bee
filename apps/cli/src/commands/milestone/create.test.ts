import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ postVersions: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("milestone create", () => {
  it("creates a milestone with provided name", async () => {
    mockClient.postVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    await parseCommand(() => import("./create"), ["-p", "TEST", "-n", "v1.0.0"]);

    expect(mockClient.postVersions).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ name: "v1.0.0" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created milestone v1.0.0 (ID: 1)");
    expect(consola.info).toHaveBeenCalledWith(
      "https://example.backlog.com/EditVersion.action?version.id=1",
    );
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("TEST")
      .mockResolvedValueOnce("Prompted Milestone");
    mockClient.postVersions.mockResolvedValue({ id: 2, name: "Prompted Milestone" });

    await parseCommand(() => import("./create"), ["-p", "TEST"]);

    expect(promptRequired).toHaveBeenCalledWith("Milestone name:", undefined);
  });

  it("passes date parameters", async () => {
    mockClient.postVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    await parseCommand(
      () => import("./create"),
      [
        "-p",
        "TEST",
        "-n",
        "v1.0.0",
        "--start-date",
        "2026-04-01",
        "--release-due-date",
        "2026-06-30",
      ],
    );

    expect(mockClient.postVersions).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({
        startDate: "2026-04-01",
        releaseDueDate: "2026-06-30",
      }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["-p", "TEST", "-n", "v1.0.0", "--json"],
      "v1.0.0",
      () => {
        mockClient.postVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });
      },
    ),
  );
});
