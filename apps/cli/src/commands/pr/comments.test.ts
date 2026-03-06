import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getPullRequestComments: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

const sampleComments = [
  {
    id: 1,
    content: "Looks good!",
    createdUser: { name: "Alice" },
    created: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    content: "Please fix the typo",
    createdUser: { name: "Bob" },
    created: "2025-01-02T00:00:00Z",
  },
];

describe("pr comments", () => {
  it("displays pull request comments", async () => {
    setupMocks();
    mockClient.getPullRequestComments.mockResolvedValue(sampleComments);

    const { comments } = await import("./comments");
    await comments.run?.({ args: { number: "42", project: "PROJ", repo: "repo" } } as never);

    expect(mockClient.getPullRequestComments).toHaveBeenCalledWith("PROJ", "repo", 42, {
      order: "asc",
      count: undefined,
    });
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Looks good!"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bob"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Please fix the typo"));
  });

  it("shows message when no comments found", async () => {
    setupMocks();
    mockClient.getPullRequestComments.mockResolvedValue([]);

    const { comments } = await import("./comments");
    await comments.run?.({ args: { number: "42", project: "PROJ", repo: "repo" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No comments found.");
  });

  it("filters out comments without content", async () => {
    setupMocks();
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 1, content: "", createdUser: { name: "Alice" }, created: "2025-01-01T00:00:00Z" },
    ]);

    const { comments } = await import("./comments");
    await comments.run?.({ args: { number: "42", project: "PROJ", repo: "repo" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No comments found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    mockClient.getPullRequestComments.mockResolvedValue(sampleComments);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { comments } = await import("./comments");
    await comments.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Looks good!"));
    writeSpy.mockRestore();
  });
});
