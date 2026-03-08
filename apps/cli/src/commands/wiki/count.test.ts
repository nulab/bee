import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWikisCount: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki count", () => {
  it("displays wiki page count", async () => {
    mockClient.getWikisCount.mockResolvedValue({ count: 42 });

    const { count } = await import("./count");
    await count.run?.({ args: { project: "TEST" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWikisCount).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith("42");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWikisCount.mockResolvedValue({ count: 42 });

    await expectStdoutContaining(async () => {
      const { count } = await import("./count");
      await count.run?.({ args: { project: "TEST", json: "" } } as never);
    }, "42");
  });
});
