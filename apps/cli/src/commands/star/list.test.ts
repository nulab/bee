import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  getUserStars: vi.fn(),
});

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleStars = [
  {
    id: 1,
    title: "TEST-1 Sample issue",
    presenter: { name: "Alice" },
    created: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Wiki: Getting Started",
    presenter: { name: "Bob" },
    created: "2025-01-02T00:00:00Z",
  },
];

describe("star list", () => {
  it("lists stars for the authenticated user when no user ID is given", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStars.mockResolvedValue(sampleStars);

    await parseCommand(() => import("./list"), []);

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getUserStars).toHaveBeenCalledWith(100, {});
    expect(consola.log).toHaveBeenCalled();
  });

  it("lists stars for a specific user", async () => {
    mockClient.getUserStars.mockResolvedValue(sampleStars);

    await parseCommand(() => import("./list"), ["200"]);

    expect(mockClient.getUserStars).toHaveBeenCalledWith(200, {});
    expect(mockClient.getMyself).not.toHaveBeenCalled();
  });

  it("shows message when no stars found", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStars.mockResolvedValue([]);

    await parseCommand(() => import("./list"), []);

    expect(consola.info).toHaveBeenCalledWith("No stars found.");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--json"],
      "Sample issue",
      () => {
        mockClient.getMyself.mockResolvedValue({ id: 100 });
        mockClient.getUserStars.mockResolvedValue(sampleStars);
      },
    ),
  );
});
