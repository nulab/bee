import { openUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getGitRepository: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  repositoryUrl: vi.fn(
    (host: string, projectKey: string, repoName: string) =>
      `https://${host}/git/${projectKey}/${repoName}`,
  ),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleRepo = {
  id: 1,
  projectId: 100,
  name: "api-server",
  description: "Main API server",
  httpUrl: "https://example.backlog.com/git/PROJ/api-server.git",
  sshUrl: "git@example.backlog.com:PROJ/api-server.git",
  displayOrder: 0,
  pushedAt: "2025-01-15T10:00:00Z",
  createdUser: { id: 1, name: "Alice" },
  created: "2024-06-01T00:00:00Z",
  updatedUser: { id: 2, name: "Bob" },
  updated: "2025-01-15T10:00:00Z",
};

describe("repo view", () => {
  it("displays repository details", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ", repository: "api-server" } } as never);

    expect(mockClient.getGitRepository).toHaveBeenCalledWith("PROJ", "api-server");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("api-server"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Main API server"));
    expect(consola.log).toHaveBeenCalledWith(
      expect.stringContaining("https://example.backlog.com/git/PROJ/api-server.git"),
    );
    expect(consola.log).toHaveBeenCalledWith(
      expect.stringContaining("git@example.backlog.com:PROJ/api-server.git"),
    );
  });

  it("opens browser with --web flag", async () => {
    const { view } = await import("./view");
    await view.run?.({
      args: { project: "PROJ", repository: "api-server", web: true },
    } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/git/PROJ/api-server");
    expect(consola.info).toHaveBeenCalledWith(
      "Opening https://example.backlog.com/git/PROJ/api-server in your browser.",
    );
    expect(mockClient.getGitRepository).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { project: "PROJ", repository: "api-server", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("api-server"));
    writeSpy.mockRestore();
  });
});
