import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  getWatchingListItems: vi.fn(),
});

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleWatchings = [
  {
    id: 1,
    resourceAlreadyRead: false,
    issue: { issueKey: "TEST-1", summary: "Fix bug" },
  },
  {
    id: 2,
    resourceAlreadyRead: true,
    issue: { issueKey: "TEST-2", summary: "Add feature" },
  },
];

describe("watching list", () => {
  it("lists watching items for the authenticated user", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getWatchingListItems.mockResolvedValue(sampleWatchings);

    await parseCommand(() => import("./list"), []);

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getWatchingListItems).toHaveBeenCalledWith(100);
    expect(consola.log).toHaveBeenCalled();
  });

  it("marks unread items with asterisk", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getWatchingListItems.mockResolvedValue([
      {
        id: 1,
        resourceAlreadyRead: false,
        issue: { issueKey: "TEST-1", summary: "Fix bug" },
      },
    ]);

    await parseCommand(() => import("./list"), []);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("*"));
  });

  it("shows message when no watching items found", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getWatchingListItems.mockResolvedValue([]);

    await parseCommand(() => import("./list"), []);

    expect(consola.info).toHaveBeenCalledWith("No watching items found.");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--json"],
      "TEST-1",
      () => {
        mockClient.getMyself.mockResolvedValue({ id: 100 });
        mockClient.getWatchingListItems.mockResolvedValue(sampleWatchings);
      },
    ),
  );
});
