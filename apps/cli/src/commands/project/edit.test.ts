import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchProject: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project edit", () => {
  it("updates project name", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "New Name" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { project: "TEST", name: "New Name" } } as never);

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated project TEST: New Name");
  });

  it("updates project archived status", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { project: "TEST", archived: true } } as never);

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ archived: true }),
    );
  });

  it("passes text formatting rule", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { project: "TEST", "text-formatting-rule": "markdown" },
    } as never);

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ textFormattingRule: "markdown" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { edit } = await import("./edit");
    await edit.run?.({ args: { project: "TEST", name: "Test", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST"));
    writeSpy.mockRestore();
  });
});
