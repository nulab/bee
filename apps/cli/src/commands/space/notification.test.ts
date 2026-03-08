import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

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

    const { default: notification } = await import("./notification");
    await notification.parseAsync([], { from: "user" });

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

    const { default: notification } = await import("./notification");
    await notification.parseAsync([], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No space notification set.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getSpaceNotification.mockResolvedValue({
      content: "Important notice",
      updated: "2024-03-01T09:00:00Z",
    });

    await expectStdoutContaining(async () => {
      const { default: notification } = await import("./notification");
      await notification.parseAsync(["--json"], { from: "user" });
    }, "Important notice");
  });
});
