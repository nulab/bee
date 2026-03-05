import { openUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getProject: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  projectUrl: vi.fn((host: string, key: string) => `https://${host}/projects/${key}`),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

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
    mockClient.getProject.mockResolvedValue(sampleProject);

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1" } } as never);

    expect(mockClient.getProject).toHaveBeenCalledWith("PROJ1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test Project"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Active"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("markdown"));
  });

  it("shows Archived status for archived project", async () => {
    mockClient.getProject.mockResolvedValue({ ...sampleProject, archived: true });

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Archived"));
  });

  it("opens browser with --web flag", async () => {
    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1", web: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/projects/PROJ1");
    expect(consola.info).toHaveBeenCalledWith(
      "Opening https://example.backlog.com/projects/PROJ1 in your browser.",
    );
    expect(mockClient.getProject).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getProject.mockResolvedValue(sampleProject);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    writeSpy.mockRestore();
  });
});
