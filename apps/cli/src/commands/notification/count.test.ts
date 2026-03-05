import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getNotificationsCount: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("notification count", () => {
  it("counts all notifications when no flags are set", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 42 });

    const { count } = await import("./count");
    await count.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith({});
    expect(consola.log).toHaveBeenCalledWith("42");
  });

  it("passes already-read as true", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 10 });

    const { count } = await import("./count");
    await count.run?.({ args: { "already-read": "true" } } as never);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyRead: true }),
    );
  });

  it("passes already-read as false", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 3 });

    const { count } = await import("./count");
    await count.run?.({ args: { "already-read": "false" } } as never);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyRead: false }),
    );
  });

  it("passes resource-already-read flag", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 5 });

    const { count } = await import("./count");
    await count.run?.({ args: { "resource-already-read": "true" } } as never);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ resourceAlreadyRead: true }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 42 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { count } = await import("./count");
    await count.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("42"));
    writeSpy.mockRestore();
  });
});
