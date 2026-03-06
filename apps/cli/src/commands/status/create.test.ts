import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postProjectStatus: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("status create", () => {
  it("creates a status with provided name and color", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("In Review");
    mockClient.postProjectStatus.mockResolvedValue({ id: 1, name: "In Review", color: "#2779ca" });

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "TEST", name: "In Review", color: "#2779ca" },
    } as never);

    expect(mockClient.postProjectStatus).toHaveBeenCalledWith("TEST", {
      name: "In Review",
      color: "#2779ca",
    });
    expect(consola.success).toHaveBeenCalledWith("Created status In Review (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Status");
    mockClient.postProjectStatus.mockResolvedValue({
      id: 2,
      name: "Prompted Status",
      color: "#2779ca",
    });

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST", color: "#2779ca" } } as never);

    expect(promptRequired).toHaveBeenCalledWith("Status name:", undefined);
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Open");
    mockClient.postProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "TEST", name: "Open", color: "#e30000", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Open"));
    writeSpy.mockRestore();
  });
});
