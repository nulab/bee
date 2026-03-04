import { getClient } from "@repo/backlog-utils";
import { promptRequired } from "@repo/cli-utils";
import { projectsCreate } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsCreate: vi.fn(),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/cli-utils")>();
  return {
    ...actual,
    promptRequired: vi.fn(),
  };
});

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockClient = {
  interceptors: { request: { use: vi.fn() } },
};

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

describe("project create", () => {
  it("creates a project with provided key and name", async () => {
    setupMocks();
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test Project");
    vi.mocked(projectsCreate).mockResolvedValue({
      data: { projectKey: "TEST", name: "Test Project", textFormattingRule: "markdown" },
    } as never);

    const { create } = await import("./create");
    await create.run?.({ args: { key: "TEST", name: "Test Project" } } as never);

    expect(projectsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        body: expect.objectContaining({
          key: "TEST",
          name: "Test Project",
        }),
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created project TEST: Test Project");
  });

  it("prompts for key and name when not provided", async () => {
    setupMocks();
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("PROMPTED")
      .mockResolvedValueOnce("Prompted Project");
    vi.mocked(projectsCreate).mockResolvedValue({
      data: { projectKey: "PROMPTED", name: "Prompted Project", textFormattingRule: "backlog" },
    } as never);

    const { create } = await import("./create");
    await create.run?.({ args: {} } as never);

    expect(promptRequired).toHaveBeenCalledWith("Project key:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Project name:", undefined);
    expect(projectsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          key: "PROMPTED",
          name: "Prompted Project",
        }),
      }),
    );
  });

  it("passes optional flags to API", async () => {
    setupMocks();
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test");
    vi.mocked(projectsCreate).mockResolvedValue({
      data: { projectKey: "TEST", name: "Test", textFormattingRule: "markdown" },
    } as never);

    const { create } = await import("./create");
    await create.run?.({
      args: {
        key: "TEST",
        name: "Test",
        "chart-enabled": true,
        "text-formatting-rule": "markdown",
      },
    } as never);

    expect(projectsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          chartEnabled: true,
          textFormattingRule: "markdown",
        }),
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    vi.mocked(promptRequired).mockResolvedValueOnce("TEST").mockResolvedValueOnce("Test");
    const project = { projectKey: "TEST", name: "Test", textFormattingRule: "markdown" };
    vi.mocked(projectsCreate).mockResolvedValue({
      data: project,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({ args: { key: "TEST", name: "Test", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST"));
    writeSpy.mockRestore();
  });
});
