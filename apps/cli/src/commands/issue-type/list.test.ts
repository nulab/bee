import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getIssueTypes: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleIssueTypes = [
  { id: 1, name: "Bug", color: "#e30000" },
  { id: 2, name: "Task", color: "#006e00" },
];

describe("issue-type list", () => {
  it("displays issue type list in tabular format", async () => {
    mockClient.getIssueTypes.mockResolvedValue(sampleIssueTypes);

    await parseCommand(() => import("./list"), ["-p", "TEST"]);

    expect(mockClient.getIssueTypes).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Task"));
  });

  it("shows message when no issue types found", async () => {
    mockClient.getIssueTypes.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["-p", "TEST"]);

    expect(consola.info).toHaveBeenCalledWith("No issue types found.");
  });

  it("displays color column", async () => {
    mockClient.getIssueTypes.mockResolvedValue(sampleIssueTypes);

    await parseCommand(() => import("./list"), ["-p", "TEST"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#e30000"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["-p", "TEST", "--json"],
      "Bug",
      () => mockClient.getIssueTypes.mockResolvedValue(sampleIssueTypes),
    ),
  );
});
