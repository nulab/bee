import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getVersions: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
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

    await parseCommand(() => import("./list"), ["TEST"]);

    expect(mockClient.getVersions).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("v1.0.0"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("v2.0.0"));
  });

  it("shows message when no milestones found", async () => {
    mockClient.getVersions.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["TEST"]);

    expect(consola.info).toHaveBeenCalledWith("No milestones found.");
  });

  it("displays archived milestone as Yes and non-archived as No", async () => {
    mockClient.getVersions.mockResolvedValue(sampleMilestones);

    await parseCommand(() => import("./list"), ["TEST"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Yes"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("No"));
  });

  it("handles null startDate and releaseDueDate gracefully", async () => {
    mockClient.getVersions.mockResolvedValue([
      {
        id: 3,
        name: "v3.0.0",
        description: "No dates",
        startDate: null,
        releaseDueDate: null,
        archived: false,
      },
    ]);

    await parseCommand(() => import("./list"), ["TEST"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("v3.0.0"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["TEST", "--json"],
      "v1.0.0",
      () => mockClient.getVersions.mockResolvedValue(sampleMilestones),
    ),
  );
});
