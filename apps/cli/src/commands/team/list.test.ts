import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getTeams: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleTeams = [
  {
    id: 1,
    name: "Design Team",
    members: [{ id: 100, name: "Alice" }],
    createdUser: { id: 1, name: "Admin" },
    created: "2025-01-01T00:00:00Z",
    updatedUser: { id: 1, name: "Admin" },
    updated: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Dev Team",
    members: [
      { id: 100, name: "Alice" },
      { id: 200, name: "Bob" },
    ],
    createdUser: { id: 1, name: "Admin" },
    created: "2025-01-01T00:00:00Z",
    updatedUser: { id: 1, name: "Admin" },
    updated: "2025-01-01T00:00:00Z",
  },
];

describe("team list", () => {
  it("displays team list in tabular format", async () => {
    mockClient.getTeams.mockResolvedValue(sampleTeams);

    await parseCommand(() => import("./list"), []);

    expect(mockClient.getTeams).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Design Team"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Dev Team"));
  });

  it("shows message when no teams found", async () => {
    mockClient.getTeams.mockResolvedValue([]);

    await parseCommand(() => import("./list"), []);

    expect(consola.info).toHaveBeenCalledWith("No teams found.");
  });

  it("passes order parameter", async () => {
    mockClient.getTeams.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--order", "desc"]);

    expect(mockClient.getTeams).toHaveBeenCalledWith(expect.objectContaining({ order: "desc" }));
  });

  it("passes offset and count parameters", async () => {
    mockClient.getTeams.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--offset", "10", "--count", "5"]);

    expect(mockClient.getTeams).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 10, count: 5 }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--json"],
      "Design Team",
      () => {
        mockClient.getTeams.mockResolvedValue(sampleTeams);
      },
    ),
  );
});
