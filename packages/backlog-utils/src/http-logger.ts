import consola from "consola";
import { Agent, type Dispatcher, setGlobalDispatcher } from "undici";

type Interceptor = (dispatch: Dispatcher["dispatch"]) => Dispatcher["dispatch"];

/** Masks sensitive query parameters (e.g. apiKey) from a URL path. */
const maskSensitiveParams = (url: string): string =>
  url.replaceAll(/([?&])(apiKey)=[^&]*/gi, "$1$2=***");

/**
 * Creates an undici interceptor that logs HTTP request start/end via consola.debug.
 *
 * Uses the undici v7 "new" handler API (onRequestStart, onResponseStart, etc.)
 * with a plain delegate object to avoid Proxy issues with private class fields.
 */
const createLoggingInterceptor = (): Interceptor => (dispatch) => (opts, handler) => {
  const method = opts.method ?? "UNKNOWN";
  const url = maskSensitiveParams(`${opts.origin ?? ""}${opts.path ?? ""}`);
  const start = performance.now();

  consola.debug(`[backlog] → ${method} ${url}`);

  return dispatch(opts, {
    onRequestStart(controller, context) {
      handler.onRequestStart?.(controller, context);
    },
    onRequestUpgrade(controller, statusCode, headers, socket) {
      handler.onRequestUpgrade?.(controller, statusCode, headers, socket);
    },
    onResponseStart(controller, statusCode, headers, statusMessage) {
      const elapsed = Math.round(performance.now() - start);
      consola.debug(`[backlog] ← ${statusCode} ${method} ${url} (${elapsed}ms)`);
      handler.onResponseStart?.(controller, statusCode, headers, statusMessage);
    },
    onResponseData(controller, data) {
      handler.onResponseData?.(controller, data);
    },
    onResponseEnd(controller, trailers) {
      handler.onResponseEnd?.(controller, trailers);
    },
    onResponseError(controller, err) {
      const elapsed = Math.round(performance.now() - start);
      consola.debug(`[backlog] ✗ ${method} ${url} (${elapsed}ms)`);
      handler.onResponseError?.(controller, err);
    },
  });
};

/** Installs the logging interceptor as the global fetch dispatcher. */
const installHttpLogger = (): void => {
  const agent = new Agent().compose(createLoggingInterceptor());
  setGlobalDispatcher(agent);
};

export { createLoggingInterceptor, installHttpLogger };
