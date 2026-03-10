import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ postIssueType: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
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

    await parseCommand(
      () => import("./create"),
      ["-p", "TEST", "-n", "Enhancement", "--color", "#2779ca"],
    );

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

    await parseCommand(() => import("./create"), ["-p", "TEST", "--color", "#2779ca"]);

    expect(promptRequired).toHaveBeenCalledWith("Issue type name:", undefined);
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["-p", "TEST", "-n", "Bug", "--color", "#e30000", "--json"],
      "Bug",
      () => {
        mockClient.postIssueType.mockResolvedValue({
          id: 1,
          name: "Bug",
          color: "#e30000",
          projectId: 100,
        });
      },
    ),
  );
});
