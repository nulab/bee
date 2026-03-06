import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getSpaceDiskUsage: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleDiskUsage = {
  capacity: 1_073_741_824,
  issue: 52_428_800,
  wiki: 10_485_760,
  file: 20_971_520,
  subversion: 0,
  git: 104_857_600,
  gitLFS: 5_242_880,
};

describe("space disk-usage", () => {
  it("displays disk usage breakdown", async () => {
    mockClient.getSpaceDiskUsage.mockResolvedValue(sampleDiskUsage);

    const { diskUsage } = await import("./disk-usage");
    await diskUsage.run?.({ args: {} } as never);

    expect(mockClient.getSpaceDiskUsage).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Capacity"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Issue"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Wiki"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Git"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Git LFS"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getSpaceDiskUsage.mockResolvedValue(sampleDiskUsage);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { diskUsage } = await import("./disk-usage");
    await diskUsage.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("1073741824"));
    writeSpy.mockRestore();
  });
});
