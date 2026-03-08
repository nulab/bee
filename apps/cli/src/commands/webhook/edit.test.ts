import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchWebhook: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("webhook edit", () => {
  it("updates webhook name", async () => {
    mockClient.patchWebhook.mockResolvedValue({ id: 1, name: "New Name" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST", "--name", "New Name"], { from: "user" });

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

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST", "--hook-url", "https://example.com/new"], {
      from: "user",
    });

    expect(mockClient.patchWebhook).toHaveBeenCalledWith("TEST", "1", {
      name: undefined,
      hookUrl: "https://example.com/new",
      allEvent: undefined,
      activityTypeIds: [],
    });
  });

  it("updates activity type IDs from repeatable option", async () => {
    mockClient.patchWebhook.mockResolvedValue({ id: 1, name: "Hook" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(
      [
        "1",
        "-p",
        "TEST",
        "--activity-type-ids",
        "1",
        "--activity-type-ids",
        "2",
        "--activity-type-ids",
        "3",
      ],
      { from: "user" },
    );

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
      const { default: edit } = await import("./edit");
      await edit.parseAsync(["1", "-p", "TEST", "--name", "Hook", "--json"], { from: "user" });
    }, "Hook");
  });
});
