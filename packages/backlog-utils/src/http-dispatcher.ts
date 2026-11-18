import { socksDispatcher } from "fetch-socks";
import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";
import { createLoggingInterceptor } from "./http-logger";

type SocksProxyOptions = {
  type: 4 | 5;
  host: string;
  port: number;
  userId?: string;
  password?: string;
};

const SOCKS_PROXY_TYPES: Record<string, SocksProxyOptions["type"]> = {
  "socks4:": 4,
  "socks4a:": 4,
  "socks5:": 5,
  "socks5h:": 5,
};

const readProxyEnv = (name: string): string | undefined =>
  process.env[name] ?? process.env[name.toLowerCase()];

/**
 * Parses HTTPS_PROXY / HTTP_PROXY / ALL_PROXY into SOCKS proxy options, if
 * one of them is set to a socks4(a)/socks5(h) URL (e.g. `socks5://host:port`).
 */
const resolveSocksProxy = (): SocksProxyOptions | undefined => {
  const raw =
    readProxyEnv("HTTPS_PROXY") ?? readProxyEnv("HTTP_PROXY") ?? readProxyEnv("ALL_PROXY");
  if (!raw) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }

  const type = SOCKS_PROXY_TYPES[url.protocol];
  if (!type) {
    return undefined;
  }

  return {
    type,
    host: url.hostname,
    port: Number(url.port) || 1080,
    ...(url.username && { userId: decodeURIComponent(url.username) }),
    ...(url.password && { password: decodeURIComponent(url.password) }),
  };
};

/** Installs the global fetch dispatcher with logging and proxy support.
 *
 * Respects the standard HTTP proxy environment variables:
 *   HTTPS_PROXY / https_proxy, HTTP_PROXY / http_proxy,
 *   NO_PROXY / no_proxy (comma-separated list of hosts to bypass).
 *
 * Also supports SOCKS4(a)/SOCKS5(h) proxies: set HTTPS_PROXY, HTTP_PROXY, or
 * ALL_PROXY / all_proxy to a `socks5://host:port` URL (or socks4/socks4a/socks5h).
 * NO_PROXY exclusions do not apply to SOCKS proxies.
 */
const installHttpDispatcher = (): void => {
  const socksProxy = resolveSocksProxy();
  const agent = socksProxy
    ? socksDispatcher(socksProxy).compose(createLoggingInterceptor())
    : new EnvHttpProxyAgent().compose(createLoggingInterceptor());
  setGlobalDispatcher(agent);
};

export { installHttpDispatcher };
