import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postWebhook: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("webhook create", () => {
  it("creates a webhook with provided arguments", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Deploy Hook");
    mockClient.postWebhook.mockResolvedValue({ id: 1, name: "Deploy Hook" });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "TEST",
        name: "Deploy Hook",
        "hook-url": "https://example.com/hook",
        "all-event": true,
      },
    } as never);

    expect(mockClient.postWebhook).toHaveBeenCalledWith("TEST", {
      name: "Deploy Hook",
      hookUrl: "https://example.com/hook",
      allEvent: true,
      activityTypeIds: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Created webhook Deploy Hook (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Hook");
    mockClient.postWebhook.mockResolvedValue({ id: 2, name: "Prompted Hook" });

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "TEST", "hook-url": "https://example.com/hook" },
    } as never);

    expect(promptRequired).toHaveBeenCalledWith("Webhook name:", undefined);
    expect(mockClient.postWebhook).toHaveBeenCalledWith("TEST", {
      name: "Prompted Hook",
      hookUrl: "https://example.com/hook",
      allEvent: undefined,
      activityTypeIds: [],
    });
  });

  it("parses activity type IDs from comma-separated string", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Hook");
    mockClient.postWebhook.mockResolvedValue({ id: 3, name: "Hook" });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "TEST",
        name: "Hook",
        "hook-url": "https://example.com/hook",
        "activity-type-ids": "1,2,3",
      },
    } as never);

    expect(mockClient.postWebhook).toHaveBeenCalledWith("TEST", {
      name: "Hook",
      hookUrl: "https://example.com/hook",
      allEvent: undefined,
      activityTypeIds: [1, 2, 3],
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Hook");
    mockClient.postWebhook.mockResolvedValue({ id: 1, name: "Hook" });

    await expectStdoutContaining(async () => {
      const { create } = await import("./create");
      await create.run?.({
        args: {
          project: "TEST",
          name: "Hook",
          "hook-url": "https://example.com/hook",
          json: "",
        },
      } as never);
    }, "Hook");
  });
});
