import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getMyself: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
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

    const { me } = await import("./me");
    await me.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("My Self"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("myself"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("myself@example.com"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal User"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue(sampleUser);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { me } = await import("./me");
    await me.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("myself"));
    writeSpy.mockRestore();
  });
});
