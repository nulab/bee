import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

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

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getProjects).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("KEY"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ2"));
  });

  it("shows message when no projects found", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No projects found.");
  });

  it("passes archived query parameter", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { archived: true } } as never);

    expect(mockClient.getProjects).toHaveBeenCalledWith(
      expect.objectContaining({ archived: true }),
    );
  });

  it("passes all query parameter", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { all: true } } as never);

    expect(mockClient.getProjects).toHaveBeenCalledWith(expect.objectContaining({ all: true }));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getProjects.mockResolvedValue([
      { projectKey: "PROJ1", name: "Project One", archived: false },
    ]);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { list } = await import("./list");
    await list.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    writeSpy.mockRestore();
  });
});
