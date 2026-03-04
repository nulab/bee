import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/utils/client.js", () => ({ getClient: vi.fn() }));
vi.mock("#/utils/format.js", () => ({
  padEnd: vi.fn((s: string, n: number) => s.padEnd(n)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

import { getClient } from "#/utils/client.js";
import consola from "consola";

const setupMockClient = () => {
  const mockClient = vi.fn();
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
  return mockClient;
};

describe("project users", () => {
  it("プロジェクトユーザー一覧を表示する", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue([
      { id: 1, userId: "user1", name: "User One", roleType: 1 },
      { id: 2, userId: "user2", name: "User Two", roleType: 2 },
    ]);

    const mod = await import("#/commands/project/users.js");
    await mod.users.run?.({ args: { "project-key": "PROJ" } } as never);

    expect(mockClient).toHaveBeenCalledWith("/projects/PROJ/users");
    expect(consola.log).toHaveBeenCalledTimes(3);
  });

  it("0件の場合メッセージ表示", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue([]);

    const mod = await import("#/commands/project/users.js");
    await mod.users.run?.({ args: { "project-key": "PROJ" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No users found.");
  });

  describe("--json", () => {
    let writeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    });

    afterEach(() => {
      writeSpy.mockRestore();
    });

    it("--json で JSON を出力する", async () => {
      const mockClient = setupMockClient();
      const data = [{ id: 1, userId: "user1", name: "User One", roleType: 1 }];
      mockClient.mockResolvedValue(data);

      const mod = await import("#/commands/project/users.js");
      await mod.users.run?.({
        args: { "project-key": "PROJ", json: "" },
      } as never);

      expect(consola.log).not.toHaveBeenCalled();
      const output = JSON.parse(String(writeSpy.mock.calls[0]?.[0]).trim());
      expect(output).toEqual(data);
    });
  });
});
