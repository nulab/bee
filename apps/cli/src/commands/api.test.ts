import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("api", () => {
  it("makes GET request by default", async () => {
    mockClient.get.mockResolvedValue({ id: 1, name: "test" });

    await expectStdoutContaining(async () => {
      const { api } = await import("./api");
      await api.run?.({ args: { endpoint: "/users/myself" } } as never);

      expect(mockClient.get).toHaveBeenCalledWith("/users/myself", {});
    }, '"name"');
  });

  it("normalizes endpoint with /api/v2 prefix", async () => {
    mockClient.get.mockResolvedValue({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { api } = await import("./api");
    await api.run?.({ args: { endpoint: "/projects" } } as never);

    expect(mockClient.get).toHaveBeenCalledWith("/projects", {});
    writeSpy.mockRestore();
  });

  it("preserves endpoint that already starts with /api/", async () => {
    mockClient.get.mockResolvedValue({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { api } = await import("./api");
    await api.run?.({ args: { endpoint: "/api/v2/space" } } as never);

    expect(mockClient.get).toHaveBeenCalledWith("space", {});
    writeSpy.mockRestore();
  });

  it("makes POST request with --method POST", async () => {
    mockClient.post.mockResolvedValue({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { api } = await import("./api");
    await api.run?.({ args: { endpoint: "/issues", method: "POST" } } as never);

    expect(mockClient.post).toHaveBeenCalledWith("/issues", {});
    writeSpy.mockRestore();
  });

  it("does not output response body with --silent", async () => {
    mockClient.get.mockResolvedValue({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { api } = await import("./api");
    await api.run?.({ args: { endpoint: "/users/myself", silent: true } } as never);

    expect(mockClient.get).toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("selects fields with --json", async () => {
    mockClient.get.mockResolvedValue({ id: 1, name: "Test User", mailAddress: "test@example.com" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { api } = await import("./api");
    await api.run?.({ args: { endpoint: "/users/myself", json: "id,name" } } as never);

    const output = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(output).toEqual({ id: 1, name: "Test User" });
    expect(output.mailAddress).toBeUndefined();
    writeSpy.mockRestore();
  });

  it("selects fields from array response with --json", async () => {
    mockClient.get.mockResolvedValue([
      { id: 1, name: "A", extra: "x" },
      { id: 2, name: "B", extra: "y" },
    ]);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { api } = await import("./api");
    await api.run?.({ args: { endpoint: "/projects", json: "id,name" } } as never);

    const output = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(output).toEqual([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);
    writeSpy.mockRestore();
  });

  it("outputs full JSON when --json is empty string", async () => {
    mockClient.get.mockResolvedValue({ id: 1, name: "test" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { api } = await import("./api");
    await api.run?.({ args: { endpoint: "/users/myself", json: "" } } as never);

    const output = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(output).toEqual({ id: 1, name: "test" });
    writeSpy.mockRestore();
  });
});
