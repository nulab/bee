import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getGitRepositories: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleRepos = [
  {
    id: 1,
    projectId: 100,
    name: "api-server",
    description: "Main API server",
    httpUrl: "https://example.backlog.com/git/PROJ/api-server.git",
    sshUrl: "git@example.backlog.com:PROJ/api-server.git",
    displayOrder: 0,
    pushedAt: "2025-01-15T10:00:00Z",
    created: "2024-06-01T00:00:00Z",
    updated: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    projectId: 100,
    name: "frontend",
    description: "Frontend app",
    httpUrl: "https://example.backlog.com/git/PROJ/frontend.git",
    sshUrl: "git@example.backlog.com:PROJ/frontend.git",
    displayOrder: 1,
    pushedAt: "2025-02-01T12:00:00Z",
    created: "2024-07-01T00:00:00Z",
    updated: "2025-02-01T12:00:00Z",
  },
];

describe("repo list", () => {
  it("displays repository list in tabular format", async () => {
    mockClient.getGitRepositories.mockResolvedValue(sampleRepos);

    const { default: list } = await import("./list");
    await list.parseAsync(["--project", "PROJ"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getGitRepositories).toHaveBeenCalledWith("PROJ");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("NAME"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("api-server"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("frontend"));
  });

  it("shows message when no repositories found", async () => {
    mockClient.getGitRepositories.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["--project", "PROJ"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No repositories found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getGitRepositories.mockResolvedValue(sampleRepos);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["--project", "PROJ", "--json"], { from: "user" });
    }, "api-server");
  });
});
