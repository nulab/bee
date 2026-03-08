import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWiki: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
  wikiUrl: vi.fn((host: string, id: number) => `https://${host}/alias/wiki/${id}`),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleWiki = {
  id: 123,
  name: "Home",
  content: "Welcome to the wiki",
  tags: [{ id: 1, name: "guide" }],
  createdUser: { name: "Alice" },
  created: "2025-01-01T00:00:00Z",
  updatedUser: { name: "Bob" },
  updated: "2025-01-02T00:00:00Z",
};

describe("wiki view", () => {
  it("displays wiki page details", async () => {
    mockClient.getWiki.mockResolvedValue(sampleWiki);

    const { view } = await import("./view");
    await view.run?.({ args: { wiki: "123" } } as never);

    expect(mockClient.getWiki).toHaveBeenCalledWith(123);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Home"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("guide"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Welcome to the wiki"));
  });

  it("opens browser with --web flag", async () => {
    const { view } = await import("./view");
    await view.run?.({ args: { wiki: "123", web: true } } as never);

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/alias/wiki/123",
      false,
      consola,
    );
    expect(mockClient.getWiki).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWiki.mockResolvedValue(sampleWiki);

    await expectStdoutContaining(async () => {
      const { view } = await import("./view");
      await view.run?.({ args: { wiki: "123", json: "" } } as never);
    }, "Home");
  });

  it("handles wiki page with no tags", async () => {
    mockClient.getWiki.mockResolvedValue({ ...sampleWiki, tags: [] });

    const { view } = await import("./view");
    await view.run?.({ args: { wiki: "123" } } as never);

    expect(mockClient.getWiki).toHaveBeenCalledWith(123);
  });
});
