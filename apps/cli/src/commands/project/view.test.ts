import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getProject: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
  projectUrl: vi.fn((host: string, key: string) => `https://${host}/projects/${key}`),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((label: string, value: unknown) => Promise.resolve(value)),
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

    const { default: view } = await import("./view");
    await view.parseAsync(["PROJ1"], { from: "user" });

    expect(mockClient.getProject).toHaveBeenCalledWith("PROJ1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test Project"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Active"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("markdown"));
  });

  it("shows Archived status for archived project", async () => {
    mockClient.getProject.mockResolvedValue({ ...sampleProject, archived: true });

    const { default: view } = await import("./view");
    await view.parseAsync(["PROJ1"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Archived"));
  });

  it("opens browser with --web flag", async () => {
    const { default: view } = await import("./view");
    await view.parseAsync(["PROJ1", "--web"], { from: "user" });

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/projects/PROJ1",
      false,
      consola,
    );
    expect(mockClient.getProject).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getProject.mockResolvedValue(sampleProject);

    await expectStdoutContaining(async () => {
      const { default: view } = await import("./view");
      await view.parseAsync(["PROJ1", "--json"], { from: "user" });
    }, "PROJ1");
  });
});
