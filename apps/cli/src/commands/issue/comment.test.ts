import { resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postIssueComments: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue comment", () => {
  it("adds a comment to an issue", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 1, content: "Hello" });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", body: "Hello" } } as never);

    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "Hello",
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Added comment to TEST-1");
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.postIssueComments.mockResolvedValue({ id: 2, content: "Stdin content" });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", body: "" } } as never);

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "Stdin content",
      notifiedUserId: [],
    });
  });

  it("adds a comment with notified users", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 3, content: "FYI" });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", body: "FYI", notify: "111,222" } } as never);

    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "FYI",
      notifiedUserId: [111, 222],
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 1, content: "Hello" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", body: "Hello", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Hello"));
    writeSpy.mockRestore();
  });
});
