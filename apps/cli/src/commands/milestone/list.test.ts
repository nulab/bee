import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getVersions: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleMilestones = [
  {
    id: 1,
    name: "v1.0.0",
    description: "First release",
    startDate: "2026-01-01T00:00:00Z",
    releaseDueDate: "2026-03-31T00:00:00Z",
    archived: false,
  },
  {
    id: 2,
    name: "v2.0.0",
    description: "Second release",
    startDate: null,
    releaseDueDate: null,
    archived: true,
  },
];

describe("milestone list", () => {
  it("displays milestone list in tabular format", async () => {
    mockClient.getVersions.mockResolvedValue(sampleMilestones);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getVersions).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("v1.0.0"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("v2.0.0"));
  });

  it("shows message when no milestones found", async () => {
    mockClient.getVersions.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No milestones found.");
  });

  it("displays archived status", async () => {
    mockClient.getVersions.mockResolvedValue(sampleMilestones);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Yes"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getVersions.mockResolvedValue(sampleMilestones);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["TEST", "--json"], { from: "user" });
    }, "v1.0.0");
  });
});
