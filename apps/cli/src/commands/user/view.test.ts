import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getUser: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleUser = {
  id: 12_345,
  userId: "testuser",
  name: "Test User",
  roleType: 2,
  lang: "ja",
  mailAddress: "test@example.com",
  lastLoginTime: "2024-01-15T10:30:00Z",
};

describe("user view", () => {
  it("displays user details", async () => {
    mockClient.getUser.mockResolvedValue(sampleUser);

    const { view } = await import("./view");
    await view.run?.({ args: { user: "12345" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getUser).toHaveBeenCalledWith(12_345);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test User"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("testuser"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("test@example.com"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal User"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-01-15"));
  });

  it("displays role label correctly for administrator", async () => {
    mockClient.getUser.mockResolvedValue({ ...sampleUser, roleType: 1 });

    const { view } = await import("./view");
    await view.run?.({ args: { user: "12345" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Administrator"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getUser.mockResolvedValue(sampleUser);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { user: "12345", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("testuser"));
    writeSpy.mockRestore();
  });
});
