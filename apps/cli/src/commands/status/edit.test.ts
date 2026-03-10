import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ patchProjectStatus: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("status edit", () => {
  it("updates status name", async () => {
    mockClient.patchProjectStatus.mockResolvedValue({ id: 1, name: "New Name", color: "#e30000" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "New Name"]);

    expect(mockClient.patchProjectStatus).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated status New Name (ID: 1)");
  });

  it("updates status color", async () => {
    mockClient.patchProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "--color", "#e30000"]);

    expect(mockClient.patchProjectStatus).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ color: "#e30000" }),
    );
  });

  it("propagates API error", async () => {
    mockClient.patchProjectStatus.mockRejectedValue(new Error("API error"));

    await expect(
      parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "New Name"]),
    ).rejects.toThrow("API error");
  });

  it("sends exact payload when only name is provided", async () => {
    mockClient.patchProjectStatus.mockResolvedValue({ id: 1, name: "New Name", color: "#e30000" });

    await parseCommand(() => import("./edit"), ["1", "-p", "TEST", "-n", "New Name"]);

    expect(mockClient.patchProjectStatus).toHaveBeenCalledWith("TEST", 1, {
      name: "New Name",
      color: undefined,
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["1", "-p", "TEST", "-n", "Open", "--json"],
      "Open",
      () =>
        mockClient.patchProjectStatus.mockResolvedValue({
          id: 1,
          name: "Open",
          color: "#e30000",
        }),
    ),
  );
});
