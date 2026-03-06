import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getWebhooks: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleWebhooks = [
  { id: 1, name: "Deploy Hook", hookUrl: "https://example.com/deploy", allEvent: true },
  { id: 2, name: "CI Hook", hookUrl: "https://example.com/ci", allEvent: false },
];

describe("webhook list", () => {
  it("displays webhook list in tabular format", async () => {
    mockClient.getWebhooks.mockResolvedValue(sampleWebhooks);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWebhooks).toHaveBeenCalledWith("TEST");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Deploy Hook"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("CI Hook"));
  });

  it("shows message when no webhooks found", async () => {
    mockClient.getWebhooks.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No webhooks found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWebhooks.mockResolvedValue(sampleWebhooks);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "TEST", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Deploy Hook"));
    writeSpy.mockRestore();
  });
});
