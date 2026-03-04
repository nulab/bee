import { resolveSpace } from "@repo/config";
import { spyOnProcessExit } from "@repo/test-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
  findSpace: vi.fn(),
  loadConfig: vi.fn(),
  resolveSpace: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth token", () => {
  it("outputs API key to stdout", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key", apiKey: "my-api-key" },
    });
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { token } = await import("#src/commands/auth/token.js");
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
      const { token } = await import("#src/commands/auth/token.js");
      token.run?.({ args: {} } as never);

      expect(stdoutSpy).toHaveBeenCalledWith("my-access-token");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("calls process.exit(1) when no space is configured", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);
    const exitSpy = spyOnProcessExit();

    try {
      const { token } = await import("#src/commands/auth/token.js");
      token.run?.({ args: {} } as never);

      expect(consola.error).toHaveBeenCalledWith(
        "No space configured. Run `bl auth login` to authenticate.",
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      exitSpy.mockRestore();
    }
  });
});
