import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getGitRepository: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockExecFileSync = vi.fn();
vi.mock("node:child_process", () => ({
  execFileSync: (...args: unknown[]) => mockExecFileSync(...args),
}));

const sampleRepo = {
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
};

describe("repo clone", () => {
  it("clones repository using SSH URL by default", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    const { clone } = await import("./clone");
    await clone.run?.({ args: { project: "PROJ", repository: "api-server" } } as never);

    expect(mockClient.getGitRepository).toHaveBeenCalledWith("PROJ", "api-server");
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      ["clone", "git@example.backlog.com:PROJ/api-server.git"],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("clones to specified directory with --directory flag", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    const { clone } = await import("./clone");
    await clone.run?.({
      args: { project: "PROJ", repository: "api-server", directory: "./dest" },
    } as never);

    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      ["clone", "git@example.backlog.com:PROJ/api-server.git", "./dest"],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("clones using HTTP URL with --http flag", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    const { clone } = await import("./clone");
    await clone.run?.({
      args: { project: "PROJ", repository: "api-server", http: true },
    } as never);

    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      ["clone", "https://example.backlog.com/git/PROJ/api-server.git"],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { clone } = await import("./clone");
    await clone.run?.({
      args: { project: "PROJ", repository: "api-server", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("api-server"));
    expect(mockExecFileSync).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });
});
