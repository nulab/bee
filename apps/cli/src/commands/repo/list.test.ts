import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getGitRepositories: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
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

    await parseCommand(() => import("./list"), ["PROJ"]);

    expect(mockClient.getGitRepositories).toHaveBeenCalledWith("PROJ");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("NAME"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("api-server"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("frontend"));
  });

  it("shows message when no repositories found", async () => {
    mockClient.getGitRepositories.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["PROJ"]);

    expect(consola.info).toHaveBeenCalledWith("No repositories found.");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["PROJ", "--json"],
      "api-server",
      () => mockClient.getGitRepositories.mockResolvedValue(sampleRepos),
    ),
  );
});
