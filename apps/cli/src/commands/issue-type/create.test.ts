import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postIssueType: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue-type create", () => {
  it("creates an issue type with provided name and color", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Enhancement");
    mockClient.postIssueType.mockResolvedValue({ id: 1, name: "Enhancement", color: "#2779ca" });

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "TEST", name: "Enhancement", color: "#2779ca" },
    } as never);

    expect(mockClient.postIssueType).toHaveBeenCalledWith("TEST", {
      name: "Enhancement",
      color: "#2779ca",
    });
    expect(consola.success).toHaveBeenCalledWith("Created issue type Enhancement (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Type");
    mockClient.postIssueType.mockResolvedValue({ id: 2, name: "Prompted Type", color: "#2779ca" });

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST", color: "#2779ca" } } as never);

    expect(promptRequired).toHaveBeenCalledWith("Issue type name:", undefined);
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Bug");
    mockClient.postIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "TEST", name: "Bug", color: "#e30000", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    writeSpy.mockRestore();
  });
});
