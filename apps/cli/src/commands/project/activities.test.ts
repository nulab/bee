import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/utils/client.js", () => ({ getClient: vi.fn() }));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));
vi.mock("#/utils/format.js", () => ({
  formatDate: vi.fn(() => "2024-01-01"),
  getActivityLabel: vi.fn(() => "Issue Created"),
}));

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

describe("project activities", () => {
  it("アクティビティを表示する", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue([
      {
        type: 1,
        createdUser: { name: "User" },
        content: { summary: "Test issue" },
        project: { projectKey: "PROJ" },
        created: "2024-01-01T00:00:00Z",
      },
    ]);

    const mod = await import("#/commands/project/activities.js");
    await mod.activities.run?.({
      args: { projectKey: "PROJ", limit: "20" },
    } as never);

    expect(mockClient).toHaveBeenCalledWith(
      "/projects/PROJ/activities",
      expect.objectContaining({ query: { count: 20 } }),
    );
    expect(consola.log).toHaveBeenCalled();
  });

  it("0件の場合メッセージ表示", async () => {
    const mockClient = setupMockClient();
    mockClient.mockResolvedValue([]);

    const mod = await import("#/commands/project/activities.js");
    await mod.activities.run?.({
      args: { projectKey: "PROJ", limit: "20" },
    } as never);

    expect(consola.info).toHaveBeenCalledWith("No activities found.");
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
      const data = [
        {
          id: 1,
          type: 1,
          created: "2024-01-01",
          project: { projectKey: "PROJ" },
        },
      ];
      mockClient.mockResolvedValue(data);

      const mod = await import("#/commands/project/activities.js");
      await mod.activities.run?.({
        args: { projectKey: "PROJ", limit: "20", json: "" },
      } as never);

      expect(consola.log).not.toHaveBeenCalled();
      const output = JSON.parse(String(writeSpy.mock.calls[0]?.[0]).trim());
      expect(output).toEqual(data);
    });
  });
});
