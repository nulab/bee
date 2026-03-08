import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getUserStars: vi.fn(),
  getMyself: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

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

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getUserStars).toHaveBeenCalledWith(100, {});
    expect(consola.log).toHaveBeenCalled();
  });

  it("lists stars for a specific user", async () => {
    mockClient.getUserStars.mockResolvedValue(sampleStars);

    const { default: list } = await import("./list");
    await list.parseAsync(["200"], { from: "user" });

    expect(mockClient.getUserStars).toHaveBeenCalledWith(200, {});
    expect(mockClient.getMyself).not.toHaveBeenCalled();
  });

  it("shows message when no stars found", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStars.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No stars found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStars.mockResolvedValue(sampleStars);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["--json"], { from: "user" });
    }, "Sample issue");
  });
});
