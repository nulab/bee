import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postProjectStatus: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("status create", () => {
  it("creates a status with provided name and color", async () => {
    mockClient.postProjectStatus.mockResolvedValue({ id: 1, name: "In Review", color: "#2779ca" });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "-n", "In Review", "--color", "#2779ca"], {
      from: "user",
    });

    expect(mockClient.postProjectStatus).toHaveBeenCalledWith("TEST", {
      name: "In Review",
      color: "#2779ca",
    });
    expect(consola.success).toHaveBeenCalledWith("Created status In Review (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("TEST")
      .mockResolvedValueOnce("Prompted Status");
    mockClient.postProjectStatus.mockResolvedValue({
      id: 2,
      name: "Prompted Status",
      color: "#2779ca",
    });

    const { default: create } = await import("./create");
    await create.parseAsync(["-p", "TEST", "--color", "#2779ca"], { from: "user" });

    expect(promptRequired).toHaveBeenCalledWith("Status name:", undefined);
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(["-p", "TEST", "-n", "Open", "--color", "#e30000", "--json"], {
        from: "user",
      });
    }, "Open");
  });
});
