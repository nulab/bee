import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  expectStdoutContaining,
  mockGetClient,
  parseCommand,
  setupCommandTest,
} from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
});

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("api", () => {
  it("makes GET request by default", async () => {
    mockClient.get.mockResolvedValue({ id: 1, name: "test" });

    await expectStdoutContaining(async () => {
      await parseCommand(() => import("./api"), ["/users/myself"]);

      expect(mockClient.get).toHaveBeenCalledWith("/users/myself", {});
    }, '"name"');
  });

  it("normalizes endpoint with /api/v2 prefix", async () => {
    mockClient.get.mockResolvedValue({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/projects"]);

    expect(mockClient.get).toHaveBeenCalledWith("/projects", {});
    writeSpy.mockRestore();
  });

  it("preserves endpoint that already starts with /api/", async () => {
    mockClient.get.mockResolvedValue({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/api/v2/space"]);

    expect(mockClient.get).toHaveBeenCalledWith("space", {});
    writeSpy.mockRestore();
  });

  it("makes POST request with --method POST", async () => {
    mockClient.post.mockResolvedValue({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-X", "POST"]);

    expect(mockClient.post).toHaveBeenCalledWith("/issues", {});
    writeSpy.mockRestore();
  });

  it("does not output response body with --silent", async () => {
    mockClient.get.mockResolvedValue({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/users/myself", "--silent"]);

    expect(mockClient.get).toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("selects fields with --json", async () => {
    mockClient.get.mockResolvedValue({ id: 1, name: "Test User", mailAddress: "test@example.com" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/users/myself", "--json", "id,name"]);

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

    await parseCommand(() => import("./api"), ["/projects", "--json", "id,name"]);

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

    await parseCommand(() => import("./api"), ["/users/myself", "--json"]);

    const output = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(output).toEqual({ id: 1, name: "test" });
    writeSpy.mockRestore();
  });

  it("reads -f value from file with @path (like gh -F)", async () => {
    vi.mocked(readFile).mockResolvedValue("line1\nline2\nline3");
    mockClient.patch.mockResolvedValue({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(
      () => import("./api"),
      ["/issues/TEST-1", "-X", "PATCH", "-f", "description=@/tmp/desc.txt"],
    );

    expect(readFile).toHaveBeenCalledWith("/tmp/desc.txt", "utf8");
    expect(mockClient.patch).toHaveBeenCalledWith("/issues/TEST-1", {
      description: "line1\nline2\nline3",
    });
    writeSpy.mockRestore();
  });

  it("applies type inference to file content in -f", async () => {
    vi.mocked(readFile).mockResolvedValue("42");
    mockClient.get.mockResolvedValue({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-f", "count=@/tmp/num.txt"]);

    expect(mockClient.get).toHaveBeenCalledWith("/issues", { count: 42 });
    writeSpy.mockRestore();
  });

  it("sends -F value with @ literally (no file reference)", async () => {
    mockClient.post.mockResolvedValue({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-X", "POST", "-F", "email=@user"]);

    expect(mockClient.post).toHaveBeenCalledWith("/issues", {
      email: "@user",
    });
    writeSpy.mockRestore();
  });
});
