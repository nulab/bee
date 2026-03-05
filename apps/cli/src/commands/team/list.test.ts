import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getTeams: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

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

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getTeams).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Design Team"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Dev Team"));
  });

  it("shows message when no teams found", async () => {
    mockClient.getTeams.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No teams found.");
  });

  it("passes order parameter", async () => {
    mockClient.getTeams.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { order: "desc" } } as never);

    expect(mockClient.getTeams).toHaveBeenCalledWith(expect.objectContaining({ order: "desc" }));
  });

  it("passes offset and count parameters", async () => {
    mockClient.getTeams.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { offset: "10", count: "5" } } as never);

    expect(mockClient.getTeams).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 10, count: 5 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getTeams.mockResolvedValue(sampleTeams);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { list } = await import("./list");
    await list.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Design Team"));
    writeSpy.mockRestore();
  });
});
