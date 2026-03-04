import { getClient } from "@repo/backlog-utils";
import { projectsUpdate } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsUpdate: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockClient = {
  interceptors: { request: { use: vi.fn() } },
};

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

describe("project edit", () => {
  it("updates project name", async () => {
    setupMocks();
    vi.mocked(projectsUpdate).mockResolvedValue({
      data: { projectKey: "TEST", name: "New Name" },
    } as never);

    const { edit } = await import("./edit");
    await edit.run?.({ args: { project: "TEST", name: "New Name" } } as never);

    expect(projectsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { projectIdOrKey: "TEST" },
        body: expect.objectContaining({ name: "New Name" }),
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated project TEST: New Name");
  });

  it("updates project archived status", async () => {
    setupMocks();
    vi.mocked(projectsUpdate).mockResolvedValue({
      data: { projectKey: "TEST", name: "Test" },
    } as never);

    const { edit } = await import("./edit");
    await edit.run?.({ args: { project: "TEST", archived: true } } as never);

    expect(projectsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ archived: true }),
      }),
    );
  });

  it("passes text formatting rule", async () => {
    setupMocks();
    vi.mocked(projectsUpdate).mockResolvedValue({
      data: { projectKey: "TEST", name: "Test" },
    } as never);

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { project: "TEST", "text-formatting-rule": "markdown" },
    } as never);

    expect(projectsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ textFormattingRule: "markdown" }),
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    const project = { projectKey: "TEST", name: "Test" };
    vi.mocked(projectsUpdate).mockResolvedValue({
      data: project,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { edit } = await import("./edit");
    await edit.run?.({ args: { project: "TEST", name: "Test", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST"));
    writeSpy.mockRestore();
  });
});
