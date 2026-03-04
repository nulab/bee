import { getClient } from "@repo/backlog-utils";
import { confirmOrExit } from "@repo/cli-utils";
import { projectsDelete } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsDelete: vi.fn(),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/cli-utils")>();
  return {
    ...actual,
    confirmOrExit: vi.fn(),
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

describe("project delete", () => {
  it("deletes project after confirmation", async () => {
    setupMocks();
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    vi.mocked(projectsDelete).mockResolvedValue({
      data: { projectKey: "TEST", name: "Test Project" },
    } as never);

    const { deleteProject } = await import("./delete");
    await deleteProject.run?.({ args: { project: "TEST" } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete project TEST? This cannot be undone.",
      undefined,
    );
    expect(projectsDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { projectIdOrKey: "TEST" },
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Deleted project TEST: Test Project");
  });

  it("skips confirmation with --yes flag", async () => {
    setupMocks();
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    vi.mocked(projectsDelete).mockResolvedValue({
      data: { projectKey: "TEST", name: "Test Project" },
    } as never);

    const { deleteProject } = await import("./delete");
    await deleteProject.run?.({ args: { project: "TEST", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    setupMocks();
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteProject } = await import("./delete");
    await deleteProject.run?.({ args: { project: "TEST" } } as never);

    expect(projectsDelete).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    const project = { projectKey: "TEST", name: "Test Project" };
    vi.mocked(projectsDelete).mockResolvedValue({
      data: project,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { deleteProject } = await import("./delete");
    await deleteProject.run?.({ args: { project: "TEST", yes: true, json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST"));
    writeSpy.mockRestore();
  });
});
