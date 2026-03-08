import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWebhook: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

const sampleWebhook = {
  id: 1,
  name: "Deploy Hook",
  hookUrl: "https://example.com/deploy",
  description: "Triggers deployment",
  allEvent: false,
  activityTypeIds: [1, 2, 3],
};

describe("webhook view", () => {
  it("displays webhook details", async () => {
    mockClient.getWebhook.mockResolvedValue(sampleWebhook);

    const { default: view } = await import("./view");
    await view.parseAsync(["1", "-p", "TEST"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWebhook).toHaveBeenCalledWith("TEST", "1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Deploy Hook"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("https://example.com/deploy"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Triggers deployment"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("1, 2, 3"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWebhook.mockResolvedValue(sampleWebhook);

    await expectStdoutContaining(async () => {
      const { default: view } = await import("./view");
      await view.parseAsync(["1", "-p", "TEST", "--json"], { from: "user" });
    }, "Deploy Hook");
  });
});
