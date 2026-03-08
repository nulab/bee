import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getProjectStatuses: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleStatuses = [
  { id: 1, name: "Open", color: "#e30000" },
  { id: 2, name: "In Progress", color: "#2779ca" },
];

describe("status list", () => {
  it("displays status list in tabular format", async () => {
    mockClient.getProjectStatuses.mockResolvedValue(sampleStatuses);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getProjectStatuses).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("In Progress"));
  });

  it("shows message when no statuses found", async () => {
    mockClient.getProjectStatuses.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No statuses found.");
  });

  it("displays color column", async () => {
    mockClient.getProjectStatuses.mockResolvedValue(sampleStatuses);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#e30000"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getProjectStatuses.mockResolvedValue(sampleStatuses);

    await expectStdoutContaining(async () => {
      const { list } = await import("./list");
      await list.run?.({ args: { project: "TEST", json: "" } } as never);
    }, "Open");
  });

  it("propagates API errors", async () => {
    mockClient.getProjectStatuses.mockRejectedValue(new Error("Not Found"));

    const { list } = await import("./list");
    await expect(list.run?.({ args: { project: "TEST" } } as never)).rejects.toThrow("Not Found");
  });
});
