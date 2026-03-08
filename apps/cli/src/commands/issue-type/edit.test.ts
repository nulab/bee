import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchIssueType: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue-type edit", () => {
  it("updates issue type name", async () => {
    mockClient.patchIssueType.mockResolvedValue({ id: 1, name: "New Name", color: "#e30000" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { issueType: "1", project: "TEST", name: "New Name" } } as never);

    expect(mockClient.patchIssueType).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated issue type New Name (ID: 1)");
  });

  it("updates issue type color", async () => {
    mockClient.patchIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { issueType: "1", project: "TEST", color: "#e30000" } } as never);

    expect(mockClient.patchIssueType).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ color: "#e30000" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    await expectStdoutContaining(async () => {
      const { edit } = await import("./edit");
      await edit.run?.({
        args: { issueType: "1", project: "TEST", name: "Bug", json: "" },
      } as never);
    }, "Bug");
  });
});
