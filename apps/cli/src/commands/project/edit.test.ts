import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ patchProject: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project edit", () => {
  it("updates project name", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "New Name" });

    await parseCommand(() => import("./edit"), ["-p", "TEST", "--name", "New Name"]);

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated project TEST: New Name");
  });

  it("updates project archived status", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    await parseCommand(() => import("./edit"), ["-p", "TEST", "--archived"]);

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ archived: true }),
    );
  });

  it("passes text formatting rule", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" });

    await parseCommand(
      () => import("./edit"),
      ["-p", "TEST", "--text-formatting-rule", "markdown"],
    );

    expect(mockClient.patchProject).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ textFormattingRule: "markdown" }),
    );
  });

  it("sends exact payload when only name is provided", async () => {
    mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "New Name" });

    await parseCommand(() => import("./edit"), ["-p", "TEST", "--name", "New Name"]);

    expect(mockClient.patchProject).toHaveBeenCalledWith("TEST", {
      name: "New Name",
      key: undefined,
      chartEnabled: undefined,
      subtaskingEnabled: undefined,
      projectLeaderCanEditProjectLeader: undefined,
      textFormattingRule: undefined,
      archived: undefined,
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["-p", "TEST", "--name", "Test", "--json"],
      "TEST",
      () => mockClient.patchProject.mockResolvedValue({ projectKey: "TEST", name: "Test" }),
    ),
  );
});
