import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getTeam: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleTeam = {
  id: 1,
  name: "Design Team",
  members: [
    { id: 100, userId: "alice", name: "Alice" },
    { id: 200, userId: "bob", name: "Bob" },
  ],
  createdUser: { id: 1, name: "Admin" },
  created: "2025-01-01T00:00:00Z",
  updatedUser: { id: 1, name: "Admin" },
  updated: "2025-02-01T00:00:00Z",
};

describe("team view", () => {
  it("displays team details", async () => {
    mockClient.getTeam.mockResolvedValue(sampleTeam);

    await parseCommand(() => import("./view"), ["1"]);

    expect(mockClient.getTeam).toHaveBeenCalledWith(1);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Design Team"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Admin"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Members:"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bob"));
  });

  it("displays team with no members", async () => {
    mockClient.getTeam.mockResolvedValue({ ...sampleTeam, members: [] });

    await parseCommand(() => import("./view"), ["1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Design Team"));
    expect(consola.log).not.toHaveBeenCalledWith(expect.stringContaining("Members:"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./view"),
      ["1", "--json"],
      "Design Team",
      () => {
        mockClient.getTeam.mockResolvedValue(sampleTeam);
      },
    ),
  );
});
