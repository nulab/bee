import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ postProject: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project create", () => {
  it("creates a project with provided key and name", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test Project");
    mockClient.postProject.mockResolvedValue({
      projectKey: "TEST",
      name: "Test Project",
      textFormattingRule: "markdown",
    });

    await parseCommand(() => import("./create"), ["--key", "TEST", "--name", "Test Project"]);

    expect(mockClient.postProject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "TEST",
        name: "Test Project",
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created project TEST: Test Project");
    expect(consola.info).toHaveBeenCalledWith("https://example.backlog.com/projects/TEST");
  });

  it("prompts for key and name when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("PROMPTED")
      .mockResolvedValueOnce("Prompted Project");
    mockClient.postProject.mockResolvedValue({
      projectKey: "PROMPTED",
      name: "Prompted Project",
      textFormattingRule: "backlog",
    });

    await parseCommand(() => import("./create"), []);

    expect(promptRequired).toHaveBeenCalledWith("Project key:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Project name:", undefined);
    expect(mockClient.postProject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "PROMPTED",
        name: "Prompted Project",
      }),
    );
  });

  it("passes optional flags to API", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test");
    mockClient.postProject.mockResolvedValue({
      projectKey: "TEST",
      name: "Test",
      textFormattingRule: "markdown",
    });

    await parseCommand(
      () => import("./create"),
      ["--key", "TEST", "--name", "Test", "--chart-enabled", "--text-formatting-rule", "markdown"],
    );

    expect(mockClient.postProject).toHaveBeenCalledWith(
      expect.objectContaining({
        chartEnabled: true,
        textFormattingRule: "markdown",
      }),
    );
  });

  it("sends exact payload with defaults when only key and name are provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test Project");
    mockClient.postProject.mockResolvedValue({
      projectKey: "TEST",
      name: "Test Project",
      textFormattingRule: "markdown",
    });

    await parseCommand(() => import("./create"), ["--key", "TEST", "--name", "Test Project"]);

    expect(mockClient.postProject).toHaveBeenCalledWith({
      key: "TEST",
      name: "Test Project",
      chartEnabled: false,
      subtaskingEnabled: false,
      projectLeaderCanEditProjectLeader: undefined,
      textFormattingRule: "markdown",
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      ["--key", "TEST", "--name", "Test", "--json"],
      "TEST",
      () => {
        vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test");
        mockClient.postProject.mockResolvedValue({
          projectKey: "TEST",
          name: "Test",
          textFormattingRule: "markdown",
        });
      },
    ),
  );
});
