import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postIssueType: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue-type create", () => {
  it("creates an issue type with provided name and color", async () => {
    mockClient.postIssueType.mockResolvedValue({
      id: 1,
      name: "Enhancement",
      color: "#2779ca",
      projectId: 100,
    });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "-n", "Enhancement", "--color", "#2779ca"], {
      from: "user",
    });

    expect(mockClient.postIssueType).toHaveBeenCalledWith("TEST", {
      name: "Enhancement",
      color: "#2779ca",
    });
    expect(consola.success).toHaveBeenCalledWith("Created issue type Enhancement (ID: 1)");
    expect(consola.info).toHaveBeenCalledWith(
      "https://example.backlog.com/EditIssueType.action?issueType.id=1&issueType.projectId=100",
    );
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Prompted Type");
    mockClient.postIssueType.mockResolvedValue({
      id: 2,
      name: "Prompted Type",
      color: "#2779ca",
      projectId: 100,
    });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "--color", "#2779ca"], { from: "user" });

    expect(promptRequired).toHaveBeenCalledWith("Issue type name:", undefined);
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postIssueType.mockResolvedValue({
      id: 1,
      name: "Bug",
      color: "#e30000",
      projectId: 100,
    });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(["-p", "TEST", "-n", "Bug", "--color", "#e30000", "--json"], {
        from: "user",
      });
    }, "Bug");
  });
});
