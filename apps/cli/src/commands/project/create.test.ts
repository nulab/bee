import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postProject: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
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

    const { default: create } = await import("./create");
    await create.parseAsync(["--key", "TEST", "--name", "Test Project"], { from: "user" });

    expect(mockClient.postProject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "TEST",
        name: "Test Project",
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created project TEST: Test Project");
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

    const { default: create } = await import("./create");
    await create.parseAsync([], { from: "user" });

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

    const { default: create } = await import("./create");
    await create.parseAsync(
      ["--key", "TEST", "--name", "Test", "--chart-enabled", "--text-formatting-rule", "markdown"],
      { from: "user" },
    );

    expect(mockClient.postProject).toHaveBeenCalledWith(
      expect.objectContaining({
        chartEnabled: true,
        textFormattingRule: "markdown",
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test");
    mockClient.postProject.mockResolvedValue({
      projectKey: "TEST",
      name: "Test",
      textFormattingRule: "markdown",
    });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(["--key", "TEST", "--name", "Test", "--json"], { from: "user" });
    }, "TEST");
  });
});
