import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({});

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project list", () => {
  it("displays project list in tabular format", async () => {
    mockClient.getProjects.mockResolvedValue([
      { projectKey: "PROJ1", name: "Project One", archived: false },
      { projectKey: "PROJ2", name: "Project Two", archived: true },
    ]);

    await parseCommand(() => import("./list"));

    expect(mockClient.getProjects).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("KEY"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ2"));
  });

  it("shows message when no projects found", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    await parseCommand(() => import("./list"));

    expect(consola.info).toHaveBeenCalledWith("No projects found.");
  });

  it("passes archived query parameter", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--archived"]);

    expect(mockClient.getProjects).toHaveBeenCalledWith(
      expect.objectContaining({ archived: true }),
    );
  });

  it("passes all query parameter", async () => {
    mockClient.getProjects.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--all"]);

    expect(mockClient.getProjects).toHaveBeenCalledWith(expect.objectContaining({ all: true }));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--json"],
      "PROJ1",
      () =>
        mockClient.getProjects.mockResolvedValue([
          { projectKey: "PROJ1", name: "Project One", archived: false },
        ]),
    ),
  );
});
