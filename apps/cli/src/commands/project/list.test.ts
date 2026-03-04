import { getClient } from "@repo/backlog-utils";
import { projectsList } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsList: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockClient = {
  interceptors: { request: { use: vi.fn() } },
};

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

describe("project list", () => {
  it("displays project list in tabular format", async () => {
    setupMocks();
    vi.mocked(projectsList).mockResolvedValue({
      data: [
        { projectKey: "PROJ1", name: "Project One", archived: false },
        { projectKey: "PROJ2", name: "Project Two", archived: true },
      ],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(projectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("KEY"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ2"));
  });

  it("shows message when no projects found", async () => {
    setupMocks();
    vi.mocked(projectsList).mockResolvedValue({
      data: [],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No projects found.");
  });

  it("passes archived query parameter", async () => {
    setupMocks();
    vi.mocked(projectsList).mockResolvedValue({
      data: [],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: { archived: true } } as never);

    expect(projectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ archived: true }),
      }),
    );
  });

  it("passes all query parameter", async () => {
    setupMocks();
    vi.mocked(projectsList).mockResolvedValue({
      data: [],
    } as never);

    const { list } = await import("./list");
    await list.run?.({ args: { all: true } } as never);

    expect(projectsList).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ all: true }),
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    const projects = [{ projectKey: "PROJ1", name: "Project One", archived: false }];
    vi.mocked(projectsList).mockResolvedValue({
      data: projects,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { list } = await import("./list");
    await list.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    writeSpy.mockRestore();
  });
});
