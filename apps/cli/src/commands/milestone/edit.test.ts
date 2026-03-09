import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ patchVersions: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("milestone edit", () => {
  it("updates milestone name", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v2.0.0" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "v2.0.0"]);

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ name: "v2.0.0" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated milestone v2.0.0 (ID: 1)");
  });

  it("archives a milestone", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "v1.0.0", "--archived"]);

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ archived: true }),
    );
  });

  it("updates date fields", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    await parseCommand(
      () => import("./edit"),
      [
        "1",
        "-p",
        "TEST",
        "-n",
        "v1.0.0",
        "--start-date",
        "2026-07-01",
        "--release-due-date",
        "2026-12-31",
      ],
    );

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({
        startDate: "2026-07-01",
        releaseDueDate: "2026-12-31",
      }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["1", "-p", "TEST", "-n", "v1.0.0", "--json"],
      "v1.0.0",
      () => mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" }),
    ),
  );
});
