import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWebhooks: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

const sampleWebhooks = [
  { id: 1, name: "Deploy Hook", hookUrl: "https://example.com/deploy", allEvent: true },
  { id: 2, name: "CI Hook", hookUrl: "https://example.com/ci", allEvent: false },
];

describe("webhook list", () => {
  it("displays webhook list in tabular format", async () => {
    mockClient.getWebhooks.mockResolvedValue(sampleWebhooks);

    const { default: list } = await import("./list");
    await list.parseAsync(["-p", "TEST"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWebhooks).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Deploy Hook"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("CI Hook"));
  });

  it("shows message when no webhooks found", async () => {
    mockClient.getWebhooks.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["-p", "TEST"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No webhooks found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWebhooks.mockResolvedValue(sampleWebhooks);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["-p", "TEST", "--json"], { from: "user" });
    }, "Deploy Hook");
  });
});
