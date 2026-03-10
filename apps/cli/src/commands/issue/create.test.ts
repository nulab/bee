import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  postIssue: vi.fn(),
  getProjects: vi.fn().mockResolvedValue([{ id: 100, projectKey: "PROJECT" }]),
});

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue create", () => {
  it("creates an issue with provided fields", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Fix bug")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("normal");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-1",
      summary: "Fix bug",
    });

    await parseCommand(
      () => import("./create"),
      ["--project", "100", "--title", "Fix bug", "--type", "1", "--priority", "normal"],
    );

    expect(mockClient.postIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 100,
        summary: "Fix bug",
        issueTypeId: 1,
        priorityId: 3,
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created issue TEST-1: Fix bug");
    expect(consola.info).toHaveBeenCalledWith("https://example.backlog.com/view/TEST-1");
  });

  it("prompts for required fields when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Title")
      .mockResolvedValueOnce("2")
      .mockResolvedValueOnce("normal");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-2",
      summary: "Title",
    });

    await parseCommand(() => import("./create"), []);

    expect(promptRequired).toHaveBeenCalledWith("Project:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Summary:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Issue type ID:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Priority:", undefined, {
      valueHint: "{high|normal|low}",
    });
  });

  it("passes optional fields to API", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Title")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("normal");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-3",
      summary: "Title",
    });

    await parseCommand(
      () => import("./create"),
      [
        "--project",
        "100",
        "--title",
        "Title",
        "--type",
        "1",
        "--priority",
        "normal",
        "--description",
        "Details",
        "--assignee",
        "12345",
        "--due-date",
        "2025-12-31",
      ],
    );

    expect(mockClient.postIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Details",
        assigneeId: 12_345,
        dueDate: "2025-12-31",
      }),
    );
  });

  it("resolves @me to current user ID for assignee", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Title")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("normal");
    mockClient.getMyself.mockResolvedValue({ id: 99_999, name: "Me" });
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-5",
      summary: "Title",
    });

    await parseCommand(
      () => import("./create"),
      [
        "--project",
        "100",
        "--title",
        "Title",
        "--type",
        "1",
        "--priority",
        "normal",
        "--assignee",
        "@me",
      ],
    );

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.postIssue).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: 99_999 }),
    );
  });

  it("passes notifiedUserId and attachmentId to API", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Title")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("normal");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-6",
      summary: "Title",
    });

    await parseCommand(
      () => import("./create"),
      [
        "--project",
        "100",
        "--title",
        "Title",
        "--type",
        "1",
        "--priority",
        "normal",
        "--notify",
        "111",
        "--notify",
        "222",
        "--attachment",
        "1",
        "--attachment",
        "2",
      ],
    );

    expect(mockClient.postIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        notifiedUserId: [111, 222],
        attachmentId: [1, 2],
      }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["--project", "100", "--title", "Title", "--type", "1", "--priority", "normal", "--json"],
      "TEST-4",
      () => {
        vi.mocked(promptRequired)
          .mockResolvedValueOnce("100")
          .mockResolvedValueOnce("Title")
          .mockResolvedValueOnce("1")
          .mockResolvedValueOnce("normal");
        mockClient.postIssue.mockResolvedValue({
          issueKey: "TEST-4",
          summary: "Title",
        });
      },
    ),
  );

  it("creates an issue with only required fields (no extra fields sent)", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Fix bug")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("normal");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-1",
      summary: "Fix bug",
    });

    await parseCommand(
      () => import("./create"),
      ["--project", "100", "--title", "Fix bug", "--type", "1", "--priority", "normal"],
    );

    const callArgs = mockClient.postIssue.mock.calls[0][0];
    expect(callArgs).toEqual({
      projectId: 100,
      summary: "Fix bug",
      issueTypeId: 1,
      priorityId: 3,
      description: undefined,
      assigneeId: undefined,
      parentIssueId: undefined,
      startDate: undefined,
      dueDate: undefined,
      estimatedHours: undefined,
      actualHours: undefined,
      notifiedUserId: [],
      attachmentId: [],
    });
  });

  it("throws error for unknown priority name", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("TEST")
      .mockResolvedValueOnce("test")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("invalid");

    await expect(
      parseCommand(
        () => import("./create"),
        ["--project", "TEST", "--title", "test", "--priority", "invalid"],
      ),
    ).rejects.toThrow('Unknown priority "invalid". Valid values: high, normal, low');
  });
});
