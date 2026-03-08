import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchWebhook: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("webhook edit", () => {
  it("updates webhook name", async () => {
    mockClient.patchWebhook.mockResolvedValue({ id: 1, name: "New Name" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { webhook: "1", project: "TEST", name: "New Name" },
    } as never);

    expect(mockClient.patchWebhook).toHaveBeenCalledWith("TEST", "1", {
      name: "New Name",
      hookUrl: undefined,
      allEvent: undefined,
      activityTypeIds: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Updated webhook New Name (ID: 1)");
  });

  it("updates webhook hook URL", async () => {
    mockClient.patchWebhook.mockResolvedValue({ id: 1, name: "Hook" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { webhook: "1", project: "TEST", "hook-url": "https://example.com/new" },
    } as never);

    expect(mockClient.patchWebhook).toHaveBeenCalledWith("TEST", "1", {
      name: undefined,
      hookUrl: "https://example.com/new",
      allEvent: undefined,
      activityTypeIds: [],
    });
  });

  it("updates activity type IDs from comma-separated string", async () => {
    mockClient.patchWebhook.mockResolvedValue({ id: 1, name: "Hook" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { webhook: "1", project: "TEST", "activity-type-ids": "1,2,3" },
    } as never);

    expect(mockClient.patchWebhook).toHaveBeenCalledWith("TEST", "1", {
      name: undefined,
      hookUrl: undefined,
      allEvent: undefined,
      activityTypeIds: [1, 2, 3],
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchWebhook.mockResolvedValue({ id: 1, name: "Hook" });

    await expectStdoutContaining(async () => {
      const { edit } = await import("./edit");
      await edit.run?.({
        args: { webhook: "1", project: "TEST", name: "Hook", json: "" },
      } as never);
    }, "Hook");
  });
});
