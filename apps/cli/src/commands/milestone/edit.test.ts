import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

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

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST", "-n", "v2.0.0"], { from: "user" });

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ name: "v2.0.0" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated milestone v2.0.0 (ID: 1)");
  });

  it("archives a milestone", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "-p", "TEST", "-n", "v1.0.0", "--archived"], { from: "user" });

    expect(mockClient.patchVersions).toHaveBeenCalledWith(
      "TEST",
      1,
      expect.objectContaining({ archived: true }),
    );
  });

  it("updates date fields", async () => {
    mockClient.patchVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(
      [
        "1",
        "-p",
        "TEST",
        "-n",
        "v1.0.0",
        "--start-date",
        "2026-07-01",
        "--release-due-date",
        "2026-12-31",
      ],
      { from: "user" },
    );

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

    await expectStdoutContaining(async () => {
      const { default: edit } = await import("./edit");
      await edit.parseAsync(["1", "-p", "TEST", "-n", "v1.0.0", "--json"], { from: "user" });
    }, "v1.0.0");
  });
});
