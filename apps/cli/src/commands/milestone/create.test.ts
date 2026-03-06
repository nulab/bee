import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postVersions: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("milestone create", () => {
  it("creates a milestone with provided name", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("v1.0.0");
    mockClient.postVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST", name: "v1.0.0" } } as never);

    expect(mockClient.postVersions).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({ name: "v1.0.0" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created milestone v1.0.0 (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Milestone");
    mockClient.postVersions.mockResolvedValue({ id: 2, name: "Prompted Milestone" });

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST" } } as never);

    expect(promptRequired).toHaveBeenCalledWith("Milestone name:", undefined);
  });

  it("passes date parameters", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("v1.0.0");
    mockClient.postVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "TEST",
        name: "v1.0.0",
        "start-date": "2026-04-01",
        "release-due-date": "2026-06-30",
      },
    } as never);

    expect(mockClient.postVersions).toHaveBeenCalledWith(
      "TEST",
      expect.objectContaining({
        startDate: "2026-04-01",
        releaseDueDate: "2026-06-30",
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("v1.0.0");
    mockClient.postVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({ args: { project: "TEST", name: "v1.0.0", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("v1.0.0"));
    writeSpy.mockRestore();
  });
});
