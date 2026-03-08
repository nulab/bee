import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getGitRepository: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
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

    const { default: view } = await import("./view");
    await view.parseAsync(["api-server", "--project", "PROJ"], { from: "user" });

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
    const { default: view } = await import("./view");
    await view.parseAsync(["api-server", "--project", "PROJ", "--web"], { from: "user" });

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/git/PROJ/api-server",
      false,
      consola,
    );
    expect(mockClient.getGitRepository).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    await expectStdoutContaining(async () => {
      const { default: view } = await import("./view");
      await view.parseAsync(["api-server", "--project", "PROJ", "--json"], { from: "user" });
    }, "api-server");
  });
});
