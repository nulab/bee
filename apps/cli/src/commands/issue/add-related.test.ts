import consola from "consola";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  expectStdoutContaining,
  mockGetClient,
  parseCommand,
  setupCommandTest,
} from "@repo/test-utils";

const ISSUE_IDS: Record<string, number> = { "PROJ-1": 100, "PROJ-2": 200, "PROJ-3": 300 };
const ISSUE_KEYS: Record<number, string> = { 100: "PROJ-1", 200: "PROJ-2", 300: "PROJ-3" };

const { mockClient, host } = setupCommandTest({
  addRelatedIssue: vi.fn((_issue: string, { targetIssueId }: { targetIssueId: number }) =>
    Promise.resolve({ id: targetIssueId, issueKey: ISSUE_KEYS[targetIssueId], type: "RELATES" }),
  ),
});
const { resolveIssueId } = vi.hoisted(() => ({ resolveIssueId: vi.fn() }));

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
  resolveIssueId,
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const resolveFromTable = () => {
  resolveIssueId.mockImplementation((_client: unknown, value: string) =>
    ISSUE_IDS[value] === undefined
      ? Promise.reject(new Error(`No such issue: ${value}`))
      : Promise.resolve(ISSUE_IDS[value]),
  );
};

describe("issue add-related", () => {
  it("relates every target by its resolved issue ID", async () => {
    resolveFromTable();

    await parseCommand(() => import("./add-related"), ["PROJ-1", "PROJ-2", "PROJ-3"]);

    expect(mockClient.addRelatedIssue).toHaveBeenNthCalledWith(1, "PROJ-1", { targetIssueId: 200 });
    expect(mockClient.addRelatedIssue).toHaveBeenNthCalledWith(2, "PROJ-1", { targetIssueId: 300 });
  });

  it("reports each relation with the key of the related issue", async () => {
    resolveFromTable();

    await parseCommand(() => import("./add-related"), ["PROJ-1", "PROJ-2", "PROJ-3"]);

    expect(consola.success).toHaveBeenNthCalledWith(1, "Added related issue PROJ-2 to PROJ-1");
    expect(consola.success).toHaveBeenNthCalledWith(2, "Added related issue PROJ-3 to PROJ-1");
  });

  it("changes no relation when a target cannot be resolved", async () => {
    resolveFromTable();

    await expect(
      parseCommand(() => import("./add-related"), ["PROJ-1", "PROJ-2", "PROJ-404"]),
    ).rejects.toThrow("No such issue: PROJ-404");

    expect(mockClient.addRelatedIssue).not.toHaveBeenCalled();
  });

  it("rejects relating an issue to itself before changing any relation", async () => {
    resolveFromTable();

    await expect(
      parseCommand(() => import("./add-related"), ["PROJ-1", "PROJ-2", "PROJ-1"]),
    ).rejects.toThrow('Cannot relate "PROJ-1" to itself.');

    expect(mockClient.addRelatedIssue).not.toHaveBeenCalled();
  });

  it("outputs the related issues as JSON without success messages when --json flag is set", async () => {
    resolveFromTable();

    await expectStdoutContaining(
      () => parseCommand(() => import("./add-related"), ["PROJ-1", "PROJ-2", "--json"]),
      "PROJ-2",
    );

    expect(consola.success).not.toHaveBeenCalled();
  });
});
