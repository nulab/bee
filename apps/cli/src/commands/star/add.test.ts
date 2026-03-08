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

    const { default: add } = await import("./add");
    await add.parseAsync(["--issue", "12345"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.postStar).toHaveBeenCalledWith({ issueId: 12_345 });
    expect(consola.success).toHaveBeenCalledWith("Starred issue 12345.");
  });

  it("stars an issue by issue key", async () => {
    mockClient.getIssue.mockResolvedValue({ id: 99_999 });
    mockClient.postStar.mockResolvedValue(undefined);

    const { default: add } = await import("./add");
    await add.parseAsync(["--issue", "PROJECT-123"], { from: "user" });

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJECT-123");
    expect(mockClient.postStar).toHaveBeenCalledWith({ issueId: 99_999 });
    expect(consola.success).toHaveBeenCalledWith("Starred issue PROJECT-123.");
  });

  it("stars a comment", async () => {
    mockClient.postStar.mockResolvedValue(undefined);

    const { default: add } = await import("./add");
    await add.parseAsync(["--comment", "67890"], { from: "user" });

    expect(mockClient.postStar).toHaveBeenCalledWith({ commentId: 67_890 });
    expect(consola.success).toHaveBeenCalledWith("Starred comment 67890.");
  });

  it("stars a wiki page", async () => {
    mockClient.postStar.mockResolvedValue(undefined);

    const { default: add } = await import("./add");
    await add.parseAsync(["--wiki", "111"], { from: "user" });

    expect(mockClient.postStar).toHaveBeenCalledWith({ wikiId: 111 });
    expect(consola.success).toHaveBeenCalledWith("Starred wiki 111.");
  });

  it("stars a pull request comment", async () => {
    mockClient.postStar.mockResolvedValue(undefined);

    const { default: add } = await import("./add");
    await add.parseAsync(["--pr-comment", "222"], { from: "user" });

    expect(mockClient.postStar).toHaveBeenCalledWith({ pullRequestCommentId: 222 });
    expect(consola.success).toHaveBeenCalledWith("Starred pull request comment 222.");
  });

  it("throws error when no option is provided", async () => {
    const { default: add } = await import("./add");

    await expect(add.parseAsync([], { from: "user" })).rejects.toThrow(
      "Exactly one of --issue, --comment, --wiki, or --pr-comment must be provided.",
    );
  });

  it("throws error when multiple options are provided", async () => {
    const { default: add } = await import("./add");

    await expect(
      add.parseAsync(["--issue", "1", "--comment", "2"], { from: "user" }),
    ).rejects.toThrow(
      "Only one of --issue, --comment, --wiki, or --pr-comment can be provided at a time.",
    );
  });
});
