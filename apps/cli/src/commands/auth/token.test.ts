import { findSpace, loadConfig } from "@repo/config";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
  findSpace: vi.fn(),
  loadConfig: vi.fn(),
}));

describe("auth token", () => {
  it("outputs API key to stdout", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [{ host: "example.backlog.com", auth: { method: "api-key", apiKey: "my-api-key" } }],
      defaultSpace: "example.backlog.com",
    });
    vi.mocked(findSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key", apiKey: "my-api-key" },
    });
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { default: token } = await import("./token");
      await token.parseAsync([], { from: "user" });

      expect(stdoutSpy).toHaveBeenCalledWith("my-api-key");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("outputs OAuth token to stdout", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: {
            method: "oauth",
            accessToken: "my-access-token",
            refreshToken: "my-refresh-token",
          },
        },
      ],
      defaultSpace: "example.backlog.com",
    });
    vi.mocked(findSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "oauth", accessToken: "my-access-token", refreshToken: "my-refresh-token" },
    });
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { default: token } = await import("./token");
      await token.parseAsync([], { from: "user" });

      expect(stdoutSpy).toHaveBeenCalledWith("my-access-token");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("throws error when no space is configured", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
    });
    vi.mocked(findSpace).mockReturnValue(null);

    const { default: token } = await import("./token");
    await expect(token.parseAsync([], { from: "user" })).rejects.toThrow(
      "No space configured. Run `bee auth login` to authenticate.",
    );
  });
});
