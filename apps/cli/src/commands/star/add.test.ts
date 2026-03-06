import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postStar: vi.fn(),
  getIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("star add", () => {
  it("stars an issue", async () => {
    mockClient.postStar.mockResolvedValue(undefined);

    const { add } = await import("./add");
    await add.run?.({ args: { issue: "12345" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.postStar).toHaveBeenCalledWith({ issueId: 12_345 });
    expect(consola.success).toHaveBeenCalledWith("Starred issue 12345.");
  });

  it("stars an issue by issue key", async () => {
    mockClient.getIssue.mockResolvedValue({ id: 99_999 });
    mockClient.postStar.mockResolvedValue(undefined);

    const { add } = await import("./add");
    await add.run?.({ args: { issue: "PROJECT-123" } } as never);

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJECT-123");
    expect(mockClient.postStar).toHaveBeenCalledWith({ issueId: 99_999 });
    expect(consola.success).toHaveBeenCalledWith("Starred issue PROJECT-123.");
  });

  it("stars a comment", async () => {
    mockClient.postStar.mockResolvedValue(undefined);

    const { add } = await import("./add");
    await add.run?.({ args: { comment: "67890" } } as never);

    expect(mockClient.postStar).toHaveBeenCalledWith({ commentId: 67_890 });
    expect(consola.success).toHaveBeenCalledWith("Starred comment 67890.");
  });

  it("stars a wiki page", async () => {
    mockClient.postStar.mockResolvedValue(undefined);

    const { add } = await import("./add");
    await add.run?.({ args: { wiki: "111" } } as never);

    expect(mockClient.postStar).toHaveBeenCalledWith({ wikiId: 111 });
    expect(consola.success).toHaveBeenCalledWith("Starred wiki 111.");
  });

  it("stars a pull request comment", async () => {
    mockClient.postStar.mockResolvedValue(undefined);

    const { add } = await import("./add");
    await add.run?.({ args: { "pr-comment": "222" } } as never);

    expect(mockClient.postStar).toHaveBeenCalledWith({ pullRequestCommentId: 222 });
    expect(consola.success).toHaveBeenCalledWith("Starred pull request comment 222.");
  });

  it("shows error when no option is provided", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { add } = await import("./add");
    await add.run?.({ args: {} } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "Exactly one of --issue, --comment, --wiki, or --pr-comment must be provided.",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("shows error when multiple options are provided", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { add } = await import("./add");
    await add.run?.({ args: { issue: "1", comment: "2" } } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "Only one of --issue, --comment, --wiki, or --pr-comment can be provided at a time.",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
