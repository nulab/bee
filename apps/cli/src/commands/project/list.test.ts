import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getProjects: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project list", () => {
  it("displays project list in tabular format", async () => {
    mockClient.getProjects.mockResolvedValue([
      { projectKey: "PROJ1", name: "Project One", archived: false },
      { projectKey: "PROJ2", name: "Project Two", archived: true },
    ]);

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getProjects).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("KEY"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ2"));
  });

  it("shows message when no projects found", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No projects found.");
  });

  it("passes archived query parameter", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["--archived"], { from: "user" });

    expect(mockClient.getProjects).toHaveBeenCalledWith(
      expect.objectContaining({ archived: true }),
    );
  });

  it("passes all query parameter", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["--all"], { from: "user" });

    expect(mockClient.getProjects).toHaveBeenCalledWith(expect.objectContaining({ all: true }));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getProjects.mockResolvedValue([
      { projectKey: "PROJ1", name: "Project One", archived: false },
    ]);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["--json"], { from: "user" });
    }, "PROJ1");
  });
});
