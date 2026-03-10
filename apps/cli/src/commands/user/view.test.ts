import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getUser: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
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

    await parseCommand(() => import("./view"), ["12345"]);

    expect(mockClient.getUser).toHaveBeenCalledWith(12_345);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test User"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("testuser"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("test@example.com"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal User"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-01-15"));
  });

  it("displays role label correctly for administrator", async () => {
    mockClient.getUser.mockResolvedValue({ ...sampleUser, roleType: 1 });

    await parseCommand(() => import("./view"), ["12345"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Administrator"));
  });

  it("handles null lastLoginTime gracefully", async () => {
    mockClient.getUser.mockResolvedValue({ ...sampleUser, lastLoginTime: null });

    await parseCommand(() => import("./view"), ["12345"]);

    expect(mockClient.getUser).toHaveBeenCalledWith(12_345);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test User"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./view"),
      ["12345", "--json"],
      "testuser",
      () => {
        mockClient.getUser.mockResolvedValue(sampleUser);
      },
    ),
  );
});
