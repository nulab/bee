import { readFile } from "node:fs/promises";
import { Backlog } from "backlog-js";
import { UserError } from "@repo/cli-utils";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  expectStdoutContaining,
  mockGetClient,
  parseCommand,
  setupCommandTest,
} from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  request: vi.fn(),
});

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

const mockJsonResponse = (data: unknown): void => {
  mockClient.request.mockResolvedValue(Response.json(data));
};

const setupSdkResponse = async (response: Response): Promise<void> => {
  const client = new Backlog({ host, apiKey: "test-key", fetch: async () => response });
  const { getClient } = await import("@repo/backlog-utils");
  vi.mocked(getClient).mockResolvedValueOnce({ client, host });
};

const captureRawOutput = async (args: string[]): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    chunks.push(Buffer.from(chunk));
    return true;
  });
  try {
    await parseCommand(() => import("./api"), args);
    return Buffer.concat(chunks);
  } finally {
    writeSpy.mockRestore();
  }
};

describe("api", () => {
  it.each(["application/octet-stream", "image/png", undefined])(
    "writes attachment bytes unchanged when Content-Type is %s",
    async (contentType) => {
      const image = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1cAAAAASUVORK5CYII=",
        "base64",
      );
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(image.subarray(0, 17));
          controller.enqueue(image.subarray(17));
          controller.close();
        },
      });
      await setupSdkResponse(
        new Response(body, {
          headers: contentType ? { "Content-Type": contentType } : {},
        }),
      );
      const output = await captureRawOutput(["issues/TEST-1/attachments/8"]);

      expect(output).toEqual(image);
      expect(process.stdout.destroyed).toBe(false);
    },
  );

  it("makes GET request by default", async () => {
    mockJsonResponse({ id: 1, name: "test" });

    await expectStdoutContaining(async () => {
      await parseCommand(() => import("./api"), ["/users/myself"]);

      expect(mockClient.request).toHaveBeenCalledWith({
        method: "GET",
        path: "/users/myself",
        params: {},
      });
    }, '"name"');
  });

  it("formats JSON responses when the media type has a JSON suffix", async () => {
    mockClient.request.mockResolvedValue(
      new Response('{ "id": 8, "name": "test", "extra": true }', {
        headers: { "Content-Type": "Application/Vnd.backlog+JSON; charset=utf-8" },
      }),
    );

    await expectStdoutContaining(async () => {
      await parseCommand(() => import("./api"), ["users/myself", "--json", "id,name"]);
    }, '{"id":8,"name":"test"}');
  });

  it("writes text responses without adding a newline", async () => {
    await setupSdkResponse(
      new Response("raw response", {
        headers: { "Content-Type": "text/plain" },
      }),
    );
    const output = await captureRawOutput(["space/notice"]);

    expect(output.toString()).toBe("raw response");
  });

  it.each(["", "id"])(
    "rejects JSON output for a binary response with fields %j",
    async (fields) => {
      const body = new ReadableStream();
      const cancelSpy = vi.spyOn(body, "cancel");
      await setupSdkResponse(new Response(body, { headers: { "Content-Type": "image/png" } }));
      const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      try {
        await expect(
          parseCommand(
            () => import("./api"),
            ["issues/TEST-1/attachments/8", "--json", ...(fields ? [fields] : [])],
          ),
        ).rejects.toThrow(new UserError("--json is only supported for JSON responses."));

        expect(writeSpy).not.toHaveBeenCalled();
        expect(cancelSpy).toHaveBeenCalledOnce();
      } finally {
        writeSpy.mockRestore();
        cancelSpy.mockRestore();
      }
    },
  );

  it("discards binary responses when --silent is set", async () => {
    const body = new ReadableStream();
    const cancelSpy = vi.spyOn(body, "cancel");
    await setupSdkResponse(new Response(body, { headers: { "Content-Type": "image/png" } }));
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      await parseCommand(() => import("./api"), ["issues/TEST-1/attachments/8", "--silent"]);

      expect(writeSpy).not.toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalledOnce();
    } finally {
      writeSpy.mockRestore();
      cancelSpy.mockRestore();
    }
  });

  it.each([
    new Response(null, { status: 204 }),
    new Response("", { headers: { "Content-Type": "application/json", "Content-Length": "0" } }),
  ])("omits output when the response is empty (%#)", async (response) => {
    mockClient.request.mockResolvedValue(response);
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      await parseCommand(() => import("./api"), ["issues/TEST-1", "-X", "DELETE"]);

      expect(writeSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("rejects unsupported methods before making a request", async () => {
    await expect(parseCommand(() => import("./api"), ["issues", "-X", "HEAD"])).rejects.toThrow(
      new UserError("Unsupported HTTP method: HEAD"),
    );

    expect(mockClient.request).not.toHaveBeenCalled();
  });

  it("encodes booleans and mixed arrays for the authenticated request", async () => {
    mockJsonResponse({});
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      await parseCommand(
        () => import("./api"),
        [
          "issues",
          "-f",
          "archived=false",
          "-f",
          "statusId=1",
          "-f",
          "statusId=2",
          "-f",
          "value=1",
          "-f",
          "value=true",
          "-F",
          "value=text",
        ],
      );

      expect(mockClient.request).toHaveBeenCalledWith({
        method: "GET",
        path: "issues",
        params: { archived: "false", statusId: ["1", "2"], value: ["1", "true", "text"] },
      });
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("normalizes endpoint with /api/v2 prefix", async () => {
    mockJsonResponse({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/projects"]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "GET",
      path: "/projects",
      params: {},
    });
    writeSpy.mockRestore();
  });

  it("preserves endpoint that already starts with /api/", async () => {
    mockJsonResponse({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/api/v2/space"]);

    expect(mockClient.request).toHaveBeenCalledWith({ method: "GET", path: "space", params: {} });
    writeSpy.mockRestore();
  });

  it("makes POST request with --method POST", async () => {
    mockJsonResponse({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-X", "POST"]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/issues",
      params: {},
    });
    writeSpy.mockRestore();
  });

  it("does not output response body with --silent", async () => {
    mockJsonResponse({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/users/myself", "--silent"]);

    expect(mockClient.request).toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("selects fields with --json", async () => {
    mockJsonResponse({ id: 1, name: "Test User", mailAddress: "test@example.com" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/users/myself", "--json", "id,name"]);

    const output = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(output).toEqual({ id: 1, name: "Test User" });
    expect(output.mailAddress).toBeUndefined();
    writeSpy.mockRestore();
  });

  it("selects fields from array response with --json", async () => {
    mockJsonResponse([
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
    mockJsonResponse({ id: 1, name: "test" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/users/myself", "--json"]);

    const output = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(output).toEqual({ id: 1, name: "test" });
    writeSpy.mockRestore();
  });

  it("reads -f value from the file named after @", async () => {
    vi.mocked(readFile).mockResolvedValue("line1\nline2\nline3");
    mockJsonResponse({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(
      () => import("./api"),
      ["/issues/TEST-1", "-X", "PATCH", "-f", "description=@/tmp/desc.txt"],
    );

    expect(readFile).toHaveBeenCalledWith("/tmp/desc.txt", "utf8");
    expect(mockClient.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/issues/TEST-1",
      params: { description: "line1\nline2\nline3" },
    });
    writeSpy.mockRestore();
  });

  it("sends numeric file content as a string, not a number", async () => {
    vi.mocked(readFile).mockResolvedValue("42");
    mockJsonResponse({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-f", "count=@/tmp/num.txt"]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "GET",
      path: "/issues",
      params: { count: "42" },
    });
    writeSpy.mockRestore();
  });

  it("keeps a whitespace-only file as whitespace instead of 0", async () => {
    vi.mocked(readFile).mockResolvedValue("\n");
    mockJsonResponse({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(
      () => import("./api"),
      ["/issues/TEST-1", "-X", "PATCH", "-f", "description=@/tmp/blank.txt"],
    );

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/issues/TEST-1",
      params: { description: "\n" },
    });
    writeSpy.mockRestore();
  });

  it("sends file content that reads as a boolean as a string", async () => {
    vi.mocked(readFile).mockResolvedValue("true");
    mockJsonResponse({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-f", "flag=@/tmp/bool.txt"]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "GET",
      path: "/issues",
      params: { flag: "true" },
    });
    writeSpy.mockRestore();
  });

  it("still infers types for values given inline", async () => {
    mockJsonResponse({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-f", "count=42", "-f", "archived=true"]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "GET",
      path: "/issues",
      params: { count: 42, archived: "true" },
    });
    writeSpy.mockRestore();
  });

  it("infers negative and fractional numbers", async () => {
    mockJsonResponse({});

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-f", "a=-7", "-f", "b=0.5"]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "GET",
      path: "/issues",
      params: { a: -7, b: 0.5 },
    });
    writeSpy.mockRestore();
  });

  it.each([
    ["1.0", "a version number keeps its minor part"],
    ["0042", "a leading zero is not dropped"],
    ["0120117117", "a phone number keeps its leading zero"],
    ["+5", "an explicit plus sign is preserved"],
    ["-0", "negative zero is not flattened"],
    [".5", "a bare decimal point is preserved"],
    ["5.", "a trailing decimal point is preserved"],
    ["0x10", "hex notation is not converted to decimal"],
    ["1e3", "exponent notation is not expanded"],
    ["12345678901234567890", "an id past 2^53 keeps every digit"],
  ])("keeps %j as a string so %s", async (value) => {
    mockJsonResponse({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-X", "POST", "-f", `summary=${value}`]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/issues",
      params: { summary: value },
    });
    writeSpy.mockRestore();
  });

  it("sends -F value with @ literally (no file reference)", async () => {
    mockJsonResponse({ id: 1 });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await parseCommand(() => import("./api"), ["/issues", "-X", "POST", "-F", "email=@user"]);

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/issues",
      params: { email: "@user" },
    });
    writeSpy.mockRestore();
  });
});
