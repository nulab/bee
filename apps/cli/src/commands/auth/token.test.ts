import { findSpace, loadConfig } from "@repo/config";
import { describe, expect, it, vi } from "vitest";
import { parseCommand } from "@repo/test-utils";

vi.mock("@repo/config", () => ({
  findSpace: vi.fn(),
  loadConfig: vi.fn(),
}));

describe("auth token", () => {
  it("outputs API key to stdout", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [{ host: "example.backlog.com", auth: { method: "api-key", apiKey: "my-api-key" } }],
      defaultSpace: "example.backlog.com",
      aliases: {},
    });
    vi.mocked(findSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key", apiKey: "my-api-key" },
    });
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await parseCommand(() => import("./token"));

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
      aliases: {},
    });
    vi.mocked(findSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "oauth", accessToken: "my-access-token", refreshToken: "my-refresh-token" },
    });
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await parseCommand(() => import("./token"));

      expect(stdoutSpy).toHaveBeenCalledWith("my-access-token");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("throws error when no space is configured", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });
    vi.mocked(findSpace).mockReturnValue(null);

    await expect(parseCommand(() => import("./token"))).rejects.toThrow(
      "No space configured. Run `bee auth login` to authenticate.",
    );
  });
});
