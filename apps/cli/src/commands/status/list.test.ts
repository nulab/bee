import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getProjectStatuses: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleStatuses = [
  { id: 1, name: "Open", color: "#e30000" },
  { id: 2, name: "In Progress", color: "#2779ca" },
];

describe("status list", () => {
  it("displays status list in tabular format", async () => {
    mockClient.getProjectStatuses.mockResolvedValue(sampleStatuses);

    await parseCommand(() => import("./list"), ["TEST"]);

    expect(mockClient.getProjectStatuses).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("In Progress"));
  });

  it("shows message when no statuses found", async () => {
    mockClient.getProjectStatuses.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["TEST"]);

    expect(consola.info).toHaveBeenCalledWith("No statuses found.");
  });

  it("displays color column", async () => {
    mockClient.getProjectStatuses.mockResolvedValue(sampleStatuses);

    await parseCommand(() => import("./list"), ["TEST"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#e30000"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["TEST", "--json"],
      "Open",
      () => {
        mockClient.getProjectStatuses.mockResolvedValue(sampleStatuses);
      },
    ),
  );
});
