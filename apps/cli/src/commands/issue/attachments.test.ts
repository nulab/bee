import { printTable } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getIssueAttachments: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  printTable: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue attachments", () => {
  it("lists attachments for an issue", async () => {
    mockClient.getIssueAttachments.mockResolvedValue([
      {
        id: 1,
        name: "file.png",
        size: 1024,
        createdUser: { name: "Alice" },
        created: "2025-01-01T00:00:00Z",
      },
    ]);
    const { default: attachments } = await import("./attachments");
    await attachments.parseAsync(["TEST-1"], { from: "user" });
    expect(mockClient.getIssueAttachments).toHaveBeenCalledWith("TEST-1");
    expect(printTable).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.arrayContaining([expect.objectContaining({ header: "NAME", value: "file.png" })]),
      ]),
    );
  });

  it("shows message when no attachments found", async () => {
    mockClient.getIssueAttachments.mockResolvedValue([]);
    const { default: attachments } = await import("./attachments");
    await attachments.parseAsync(["TEST-1"], { from: "user" });
    expect(consola.info).toHaveBeenCalledWith("No attachments found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getIssueAttachments.mockResolvedValue([
      {
        id: 1,
        name: "file.png",
        size: 1024,
        createdUser: { name: "Alice" },
        created: "2025-01-01T00:00:00Z",
      },
    ]);
    await expectStdoutContaining(async () => {
      const { default: attachments } = await import("./attachments");
      await attachments.parseAsync(["TEST-1", "--json"], { from: "user" });
    }, "file.png");
  });
});
