import { resolveSpace } from "@repo/config";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

vi.mock("@repo/config", () => ({
  findSpace: vi.fn(),
  loadConfig: vi.fn(),
  resolveSpace: vi.fn(),
}));

describe("auth token", () => {
  it("outputs API key to stdout", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key", apiKey: "my-api-key" },
    });
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { token } = await import("./token");
      token.run?.({ args: {} } as never);

      expect(stdoutSpy).toHaveBeenCalledWith("my-api-key");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("outputs OAuth token to stdout", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "oauth", accessToken: "my-access-token", refreshToken: "my-refresh-token" },
    });
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { token } = await import("./token");
      token.run?.({ args: {} } as never);

      expect(stdoutSpy).toHaveBeenCalledWith("my-access-token");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("throws error when no space is configured", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);

    const { token } = await import("./token");
    expect(() => token.run?.({ args: {} } as never)).toThrow(
      "No space configured. Run `bee auth login` to authenticate.",
    );
  });
});
