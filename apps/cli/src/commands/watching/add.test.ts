import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postWatchingListItem: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("watching add", () => {
  it("adds a watching item for an issue", async () => {
    mockClient.postWatchingListItem.mockResolvedValue({
      id: 1,
      issue: { issueKey: "TEST-1", summary: "Fix bug" },
    });

    const { add } = await import("./add");
    await add.run?.({ args: { issue: "TEST-1" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.postWatchingListItem).toHaveBeenCalledWith({
      issueIdOrKey: "TEST-1",
      note: "",
    });
    expect(consola.success).toHaveBeenCalledWith("Added watching for issue TEST-1 (ID: 1).");
  });

  it("adds a watching item with a note", async () => {
    mockClient.postWatchingListItem.mockResolvedValue({
      id: 2,
      issue: { issueKey: "TEST-2", summary: "Add feature" },
    });

    const { add } = await import("./add");
    await add.run?.({ args: { issue: "TEST-2", note: "Track progress" } } as never);

    expect(mockClient.postWatchingListItem).toHaveBeenCalledWith({
      issueIdOrKey: "TEST-2",
      note: "Track progress",
    });
    expect(consola.success).toHaveBeenCalledWith("Added watching for issue TEST-2 (ID: 2).");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postWatchingListItem.mockResolvedValue({
      id: 1,
      issue: { issueKey: "TEST-1", summary: "Fix bug" },
    });

    await expectStdoutContaining(async () => {
      const { add } = await import("./add");
      await add.run?.({ args: { issue: "TEST-1", json: "" } } as never);
    }, "TEST-1");
  });
});
