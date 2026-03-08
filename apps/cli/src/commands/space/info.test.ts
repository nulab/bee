import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getSpace: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleSpace = {
  spaceKey: "TESTSPACE",
  name: "Test Space",
  ownerId: 12_345,
  lang: "ja",
  timezone: "Asia/Tokyo",
  created: "2024-01-01T00:00:00Z",
  updated: "2024-06-15T12:00:00Z",
};

describe("space info", () => {
  it("displays space information", async () => {
    mockClient.getSpace.mockResolvedValue(sampleSpace);

    const { info } = await import("./info");
    await info.run?.({ args: {} } as never);

    expect(mockClient.getSpace).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test Space"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("TESTSPACE"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Asia/Tokyo"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-01-01"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getSpace.mockResolvedValue(sampleSpace);

    await expectStdoutContaining(async () => {
      const { info } = await import("./info");
      await info.run?.({ args: { json: "" } } as never);
    }, "TESTSPACE");
  });
});
