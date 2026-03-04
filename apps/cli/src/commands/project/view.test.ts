import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/utils/client.js", () => ({ getClient: vi.fn() }));
vi.mock("#/utils/url.js", () => ({
  openUrl: vi.fn(),
  projectUrl: vi.fn(() => "https://example.backlog.com/projects/PROJ"),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

import { getClient } from "#/utils/client.js";
import { openUrl, projectUrl } from "#/utils/url.js";
import consola from "consola";

const setupMockClient = () => {
  const mockClient = vi.fn();
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
  return mockClient;
};

describe("project view", () => {
  const mockProject = {
    id: 1,
    projectKey: "PROJ",
    name: "Test Project",
    archived: false,
    textFormattingRule: "markdown",
    chartEnabled: true,
    subtaskingEnabled: false,
    useWiki: true,
    useFileSharing: true,
    useDevAttributes: false,
  };

  it("プロジェクト詳細を表示する", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue(mockProject);

    const mod = await import("#/commands/project/view.js");
    await mod.view.run?.({
      args: { projectKey: "PROJ", web: false },
    } as never);

    expect(mockClient).toHaveBeenCalledWith("/projects/PROJ");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test Project"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ"));
  });

  it("--web でブラウザを開く", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue(mockProject);

    const mod = await import("#/commands/project/view.js");
    await mod.view.run?.({
      args: { projectKey: "PROJ", web: true },
    } as never);

    expect(projectUrl).toHaveBeenCalledWith("example.backlog.com", "PROJ");
    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/projects/PROJ");
    expect(consola.info).toHaveBeenCalledWith(expect.stringContaining("Opening"));
  });

  describe("--json", () => {
    let writeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    });

    afterEach(() => {
      writeSpy.mockRestore();
    });

    it("--json で JSON を出力する", async () => {
      const mockClient = setupMockClient();
      mockClient.mockResolvedValue(mockProject);

      const mod = await import("#/commands/project/view.js");
      await mod.view.run?.({
        args: { projectKey: "PROJ", web: false, json: "" },
      } as never);

      expect(consola.log).not.toHaveBeenCalled();
      const output = JSON.parse(String(writeSpy.mock.calls[0]?.[0]).trim());
      expect(output.projectKey).toBe("PROJ");
    });
  });
});
