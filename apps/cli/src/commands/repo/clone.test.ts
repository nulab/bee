import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getGitRepository: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockSpawn = vi.fn();
vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
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

const createMockChildProcess = (exitCode = 0) => ({
  on: vi.fn((event: string, cb: (code: number) => void) => {
    if (event === "close") {
      cb(exitCode);
    }
  }),
});

describe("repo clone", () => {
  it("clones repository using SSH URL by default", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);
    mockSpawn.mockReturnValue(createMockChildProcess());

    const { default: clone } = await import("./clone");
    await clone.parseAsync(["api-server", "--project", "PROJ"], { from: "user" });

    expect(mockClient.getGitRepository).toHaveBeenCalledWith("PROJ", "api-server");
    expect(mockSpawn).toHaveBeenCalledWith(
      "git",
      ["clone", "git@example.backlog.com:PROJ/api-server.git"],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("clones to specified directory with --directory flag", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);
    mockSpawn.mockReturnValue(createMockChildProcess());

    const { default: clone } = await import("./clone");
    await clone.parseAsync(["api-server", "--project", "PROJ", "--directory", "./dest"], {
      from: "user",
    });

    expect(mockSpawn).toHaveBeenCalledWith(
      "git",
      ["clone", "git@example.backlog.com:PROJ/api-server.git", "./dest"],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("clones using HTTP URL with --http flag", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);
    mockSpawn.mockReturnValue(createMockChildProcess());

    const { default: clone } = await import("./clone");
    await clone.parseAsync(["api-server", "--project", "PROJ", "--http"], { from: "user" });

    expect(mockSpawn).toHaveBeenCalledWith(
      "git",
      ["clone", "https://example.backlog.com/git/PROJ/api-server.git"],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("throws error when git clone fails", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);
    mockSpawn.mockReturnValue(createMockChildProcess(128));

    const { default: clone } = await import("./clone");

    await expect(
      clone.parseAsync(["api-server", "--project", "PROJ"], { from: "user" }),
    ).rejects.toThrow("git clone exited with code 128");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getGitRepository.mockResolvedValue(sampleRepo);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { default: clone } = await import("./clone");
    await clone.parseAsync(["api-server", "--project", "PROJ", "--json"], { from: "user" });

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("api-server"));
    expect(mockSpawn).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });
});
