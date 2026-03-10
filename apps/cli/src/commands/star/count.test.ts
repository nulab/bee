import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getUserStarsCount: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("star count", () => {
  it("counts stars for the authenticated user when no user ID is given", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStarsCount.mockResolvedValue({ count: 42 });

    await parseCommand(() => import("./count"), []);

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getUserStarsCount).toHaveBeenCalledWith(100, {});
    expect(consola.log).toHaveBeenCalledWith("42");
  });

  it("counts stars for a specific user", async () => {
    mockClient.getUserStarsCount.mockResolvedValue({ count: 10 });

    await parseCommand(() => import("./count"), ["200"]);

    expect(mockClient.getUserStarsCount).toHaveBeenCalledWith(200, {});
    expect(mockClient.getMyself).not.toHaveBeenCalled();
  });

  it("passes since and until params", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStarsCount.mockResolvedValue({ count: 5 });

    await parseCommand(() => import("./count"), ["--since", "2025-01-01", "--until", "2025-12-31"]);

    expect(mockClient.getUserStarsCount).toHaveBeenCalledWith(100, {
      since: "2025-01-01",
      until: "2025-12-31",
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./count"),
      ["--json"],
      "42",
      () => {
        mockClient.getMyself.mockResolvedValue({ id: 100 });
        mockClient.getUserStarsCount.mockResolvedValue({ count: 42 });
      },
    ),
  );
});
