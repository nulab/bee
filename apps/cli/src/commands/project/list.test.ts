import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/utils/client.js", () => ({ getClient: vi.fn() }));
vi.mock("#/utils/format.js", () => ({
  formatProjectLine: vi.fn(() => "PROJ  Test Project  Active"),
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

describe("project list", () => {
  it("プロジェクト一覧を表示する", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue([
      { id: 1, projectKey: "PROJ1", name: "Project 1", archived: false },
      { id: 2, projectKey: "PROJ2", name: "Project 2", archived: false },
    ]);

    const mod = await import("#/commands/project/list.js");
    await mod.list.run?.({ args: { limit: "20" } } as never);

    expect(mockClient).toHaveBeenCalledWith("/projects", expect.objectContaining({ query: {} }));
    expect(consola.log).toHaveBeenCalledTimes(3);
  });

  it("0件の場合メッセージ表示", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue([]);

    const mod = await import("#/commands/project/list.js");
    await mod.list.run?.({ args: { limit: "20" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No projects found.");
  });

  it("--archived でクエリに archived が含まれる", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue([]);

    const mod = await import("#/commands/project/list.js");
    await mod.list.run?.({ args: { archived: true, limit: "20" } } as never);

    expect(mockClient).toHaveBeenCalledWith(
      "/projects",
      expect.objectContaining({ query: { archived: true } }),
    );
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
      const data = [{ id: 1, projectKey: "PROJ1", name: "Project 1", archived: false }];
      mockClient.mockResolvedValue(data);

      const mod = await import("#/commands/project/list.js");
      await mod.list.run?.({ args: { limit: "20", json: "" } } as never);

      expect(consola.log).not.toHaveBeenCalled();
      const output = JSON.parse(String(writeSpy.mock.calls[0]?.[0]).trim());
      expect(output).toEqual(data);
    });
  });
});
