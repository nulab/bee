import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";
import { createLoggingInterceptor } from "./http-logger";

/** Installs the global fetch dispatcher with logging and proxy support.
 *
 * Respects the standard HTTP proxy environment variables:
 *   HTTPS_PROXY / https_proxy, HTTP_PROXY / http_proxy,
 *   NO_PROXY / no_proxy (comma-separated list of hosts to bypass).
 */
const installHttpDispatcher = (): void => {
  const agent = new EnvHttpProxyAgent().compose(createLoggingInterceptor());
  setGlobalDispatcher(agent);
};

export { installHttpDispatcher };
