import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getIssueTypes: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleIssueTypes = [
  { id: 1, name: "Bug", color: "#e30000" },
  { id: 2, name: "Task", color: "#006e00" },
];

describe("issue-type list", () => {
  it("displays issue type list in tabular format", async () => {
    mockClient.getIssueTypes.mockResolvedValue(sampleIssueTypes);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getIssueTypes).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Task"));
  });

  it("shows message when no issue types found", async () => {
    mockClient.getIssueTypes.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No issue types found.");
  });

  it("displays color column", async () => {
    mockClient.getIssueTypes.mockResolvedValue(sampleIssueTypes);

    const { default: list } = await import("./list");
    await list.parseAsync(["TEST"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#e30000"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getIssueTypes.mockResolvedValue(sampleIssueTypes);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["TEST", "--json"], { from: "user" });
    }, "Bug");
  });
});
