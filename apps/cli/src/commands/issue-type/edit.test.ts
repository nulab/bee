import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ patchIssueType: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue-type edit", () => {
  it("updates issue type name", async () => {
    mockClient.patchIssueType.mockResolvedValue({ id: 1, name: "New Name", color: "#e30000" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "New Name"]);

    expect(mockClient.patchIssueType).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated issue type New Name (ID: 1)");
  });

  it("updates issue type color", async () => {
    mockClient.patchIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "--color", "#e30000"]);

    expect(mockClient.patchIssueType).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ color: "#e30000" }),
    );
  });

  it("propagates API error", async () => {
    mockClient.patchIssueType.mockRejectedValue(new Error("API error"));

    await expect(
      parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "New Name"]),
    ).rejects.toThrow("API error");
  });

  it("sends exact payload when only name is provided", async () => {
    mockClient.patchIssueType.mockResolvedValue({ id: 1, name: "New Name", color: "#e30000" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "New Name"]);

    expect(mockClient.patchIssueType).toHaveBeenCalledWith("TEST", 1, {
      name: "New Name",
      color: undefined,
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["1", "-p", "TEST", "-n", "Bug", "--json"],
      "Bug",
      () => mockClient.patchIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" }),
    ),
  );
});
