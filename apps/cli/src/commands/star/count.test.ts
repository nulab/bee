import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getUserStarsCount: vi.fn(),
  getMyself: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("star count", () => {
  it("counts stars for the authenticated user when no user ID is given", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStarsCount.mockResolvedValue({ count: 42 });

    const { count } = await import("./count");
    await count.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getUserStarsCount).toHaveBeenCalledWith(100, {});
    expect(consola.log).toHaveBeenCalledWith("42");
  });

  it("counts stars for a specific user", async () => {
    mockClient.getUserStarsCount.mockResolvedValue({ count: 10 });

    const { count } = await import("./count");
    await count.run?.({ args: { user: "200" } } as never);

    expect(mockClient.getUserStarsCount).toHaveBeenCalledWith(200, {});
    expect(mockClient.getMyself).not.toHaveBeenCalled();
  });

  it("passes since and until params", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStarsCount.mockResolvedValue({ count: 5 });

    const { count } = await import("./count");
    await count.run?.({
      args: { since: "2025-01-01", until: "2025-12-31" },
    } as never);

    expect(mockClient.getUserStarsCount).toHaveBeenCalledWith(100, {
      since: "2025-01-01",
      until: "2025-12-31",
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getUserStarsCount.mockResolvedValue({ count: 42 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { count } = await import("./count");
    await count.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("42"));
    writeSpy.mockRestore();
  });
});
