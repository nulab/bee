import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchVersions: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("milestone edit", () => {
  it("updates milestone name", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v2.0.0" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { milestone: "1", project: "TEST", name: "v2.0.0" } } as never);

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ name: "v2.0.0" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated milestone v2.0.0 (ID: 1)");
  });

  it("archives a milestone", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { milestone: "1", project: "TEST", archived: true } } as never);

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ archived: true }),
    );
  });

  it("updates date fields", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: {
        milestone: "1",
        project: "TEST",
        "start-date": "2026-07-01",
        "release-due-date": "2026-12-31",
      },
    } as never);

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({
        startDate: "2026-07-01",
        releaseDueDate: "2026-12-31",
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { milestone: "1", project: "TEST", name: "v1.0.0", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("v1.0.0"));
    writeSpy.mockRestore();
  });
});
