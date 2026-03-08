import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWikisAttachments: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki attachments", () => {
  it("displays wiki attachments in tabular format", async () => {
    mockClient.getWikisAttachments.mockResolvedValue([
      {
        name: "doc.pdf",
        size: 1024,
        createdUser: { name: "Alice" },
        created: "2025-01-01T00:00:00Z",
      },
      {
        name: "image.png",
        size: 2048,
        createdUser: { name: "Bob" },
        created: "2025-01-02T00:00:00Z",
      },
    ]);

    const { attachments } = await import("./attachments");
    await attachments.run?.({ args: { wiki: "123" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWikisAttachments).toHaveBeenCalledWith(123);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("NAME"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("doc.pdf"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("image.png"));
  });

  it("shows message when no attachments found", async () => {
    mockClient.getWikisAttachments.mockResolvedValue([]);

    const { attachments } = await import("./attachments");
    await attachments.run?.({ args: { wiki: "123" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No attachments found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWikisAttachments.mockResolvedValue([
      {
        name: "doc.pdf",
        size: 1024,
        createdUser: { name: "Alice" },
        created: "2025-01-01T00:00:00Z",
      },
    ]);

    await expectStdoutContaining(async () => {
      const { attachments } = await import("./attachments");
      await attachments.run?.({ args: { wiki: "123", json: "" } } as never);
    }, "doc.pdf");
  });
});
