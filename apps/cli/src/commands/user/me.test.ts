import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getMyself: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleUser = {
  id: 99_999,
  userId: "myself",
  name: "My Self",
  roleType: 2,
  lang: "ja",
  mailAddress: "myself@example.com",
  lastLoginTime: "2024-03-01T08:00:00Z",
};

describe("user me", () => {
  it("displays authenticated user details", async () => {
    mockClient.getMyself.mockResolvedValue(sampleUser);

    const { default: me } = await import("./me");
    await me.parseAsync([], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("My Self"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("myself"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("myself@example.com"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal User"));
  });

  it("handles null lastLoginTime gracefully", async () => {
    mockClient.getMyself.mockResolvedValue({ ...sampleUser, lastLoginTime: null });

    const { default: me } = await import("./me");
    await me.parseAsync([], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("My Self"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue(sampleUser);

    await expectStdoutContaining(async () => {
      const { default: me } = await import("./me");
      await me.parseAsync(["--json"], { from: "user" });
    }, "myself");
  });
});
