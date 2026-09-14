import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("undici", () => {
  const MockAgent = vi.fn();
  MockAgent.prototype.compose = vi.fn(function (this: unknown) {
    return this;
  });
  return {
    EnvHttpProxyAgent: MockAgent,
    setGlobalDispatcher: vi.fn(),
  };
});

vi.mock("fetch-socks", () => {
  const socksDispatcher = vi.fn(() => ({
    compose: vi.fn(function (this: unknown) {
      return this;
    }),
  }));
  return { socksDispatcher };
});

const PROXY_ENV_VARS = [
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
  "ALL_PROXY",
  "all_proxy",
];

describe("installHttpDispatcher", () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    for (const name of PROXY_ENV_VARS) {
      originalEnv[name] = process.env[name];
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of PROXY_ENV_VARS) {
      if (originalEnv[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = originalEnv[name];
      }
    }
  });

  it("calls setGlobalDispatcher with a composed EnvHttpProxyAgent when no SOCKS proxy is configured", async () => {
    const { EnvHttpProxyAgent, setGlobalDispatcher } = await import("undici");
    const { socksDispatcher } = await import("fetch-socks");
    const { installHttpDispatcher } = await import("./http-dispatcher");

    installHttpDispatcher();

    expect(EnvHttpProxyAgent).toHaveBeenCalled();
    expect(vi.mocked(EnvHttpProxyAgent).prototype.compose).toHaveBeenCalled();
    expect(socksDispatcher).not.toHaveBeenCalled();
    expect(setGlobalDispatcher).toHaveBeenCalled();
  });

  it("falls back to EnvHttpProxyAgent when HTTPS_PROXY is a plain http(s) URL", async () => {
    process.env.HTTPS_PROXY = "http://proxy.example.com:8080";

    const { EnvHttpProxyAgent } = await import("undici");
    const { socksDispatcher } = await import("fetch-socks");
    const { installHttpDispatcher } = await import("./http-dispatcher");

    installHttpDispatcher();

    expect(EnvHttpProxyAgent).toHaveBeenCalled();
    expect(socksDispatcher).not.toHaveBeenCalled();
  });

  it("uses a SOCKS5 dispatcher when HTTPS_PROXY is a socks5:// URL", async () => {
    process.env.HTTPS_PROXY = "socks5://user:pass@127.0.0.1:1080";

    const { EnvHttpProxyAgent, setGlobalDispatcher } = await import("undici");
    const { socksDispatcher } = await import("fetch-socks");
    const { installHttpDispatcher } = await import("./http-dispatcher");

    installHttpDispatcher();

    expect(socksDispatcher).toHaveBeenCalledWith({
      type: 5,
      host: "127.0.0.1",
      port: 1080,
      userId: "user",
      password: "pass",
    });
    expect(EnvHttpProxyAgent).not.toHaveBeenCalled();
    expect(setGlobalDispatcher).toHaveBeenCalled();
  });

  it("defaults to port 1080 and supports socks4a when no port is given", async () => {
    process.env.ALL_PROXY = "socks4a://10.0.0.1";

    const { socksDispatcher } = await import("fetch-socks");
    const { installHttpDispatcher } = await import("./http-dispatcher");

    installHttpDispatcher();

    expect(socksDispatcher).toHaveBeenCalledWith({
      type: 4,
      host: "10.0.0.1",
      port: 1080,
    });
  });

  it("prefers HTTPS_PROXY over ALL_PROXY", async () => {
    process.env.HTTPS_PROXY = "socks5://primary.example.com:1080";
    process.env.ALL_PROXY = "socks5://fallback.example.com:1080";

    const { socksDispatcher } = await import("fetch-socks");
    const { installHttpDispatcher } = await import("./http-dispatcher");

    installHttpDispatcher();

    expect(socksDispatcher).toHaveBeenCalledWith(
      expect.objectContaining({ host: "primary.example.com" }),
    );
  });

  it("ignores an invalid proxy URL and falls back to EnvHttpProxyAgent", async () => {
    process.env.HTTPS_PROXY = "not-a-valid-url";

    const { EnvHttpProxyAgent } = await import("undici");
    const { socksDispatcher } = await import("fetch-socks");
    const { installHttpDispatcher } = await import("./http-dispatcher");

    installHttpDispatcher();

    expect(EnvHttpProxyAgent).toHaveBeenCalled();
    expect(socksDispatcher).not.toHaveBeenCalled();
  });
});
