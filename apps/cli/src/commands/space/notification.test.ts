import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getSpaceNotification: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("space notification", () => {
  it("displays the space notification", async () => {
    mockClient.getSpaceNotification.mockResolvedValue({
      content: "System maintenance scheduled for this weekend.",
      updated: "2024-03-01T09:00:00Z",
    });

    const { notification } = await import("./notification");
    await notification.run?.({ args: {} } as never);

    expect(mockClient.getSpaceNotification).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(
      expect.stringContaining("System maintenance scheduled for this weekend."),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-03-01"));
  });

  it("shows message when no notification is set", async () => {
    mockClient.getSpaceNotification.mockResolvedValue({
      content: "",
      updated: null,
    });

    const { notification } = await import("./notification");
    await notification.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No space notification set.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getSpaceNotification.mockResolvedValue({
      content: "Important notice",
      updated: "2024-03-01T09:00:00Z",
    });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { notification } = await import("./notification");
    await notification.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Important notice"));
    writeSpy.mockRestore();
  });
});
