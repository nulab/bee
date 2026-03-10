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

  it("sends exact payload with only required fields (no extra fields)", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v2.0.0" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "v2.0.0"]);

    expect(mockClient.patchVersions).toHaveBeenCalledWith("TEST", 1, {
      name: "v2.0.0",
      description: undefined,
      startDate: undefined,
      releaseDueDate: undefined,
      archived: undefined,
    });
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
