import { getClient, openUrl } from "@repo/backlog-utils";
import { projectsGet } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
  openUrl: vi.fn(),
  projectUrl: vi.fn((host: string, key: string) => `https://${host}/projects/${key}`),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsGet: vi.fn(),
}));

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

const sampleProject = {
  id: 1,
  projectKey: "PROJ1",
  name: "Test Project",
  archived: false,
  textFormattingRule: "markdown",
  chartEnabled: true,
  subtaskingEnabled: false,
  useWiki: true,
  useFileSharing: true,
  useGit: true,
  useSubversion: false,
  useDevAttributes: false,
};

describe("project view", () => {
  it("displays project details", async () => {
    setupMocks();
    vi.mocked(projectsGet).mockResolvedValue({
      data: sampleProject,
    } as never);

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1" } } as never);

    expect(projectsGet).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { projectIdOrKey: "PROJ1" },
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test Project"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Active"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("markdown"));
  });

  it("shows Archived status for archived project", async () => {
    setupMocks();
    vi.mocked(projectsGet).mockResolvedValue({
      data: { ...sampleProject, archived: true },
    } as never);

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Archived"));
  });

  it("opens browser with --web flag", async () => {
    setupMocks();

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1", web: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/projects/PROJ1");
    expect(consola.info).toHaveBeenCalledWith(
      "Opening https://example.backlog.com/projects/PROJ1 in your browser.",
    );
    expect(projectsGet).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    vi.mocked(projectsGet).mockResolvedValue({
      data: sampleProject,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    writeSpy.mockRestore();
  });
});
