import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchProject: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((label: string, value: unknown) => Promise.resolve(value)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project edit", () => {
  it("updates project name", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "New Name" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["TEST", "--name", "New Name"], { from: "user" });

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated project TEST: New Name");
  });

  it("updates project archived status", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["TEST", "--archived"], { from: "user" });

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ archived: true }),
    );
  });

  it("passes text formatting rule", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["TEST", "--text-formatting-rule", "markdown"], {
      from: "user",
    });

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ textFormattingRule: "markdown" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    await expectStdoutContaining(async () => {
      const { default: edit } = await import("./edit");
      await edit.parseAsync(["TEST", "--name", "Test", "--json"], { from: "user" });
    }, "TEST");
  });
});
