import consola from "consola";
import { Agent, type Dispatcher, setGlobalDispatcher } from "undici";

type Interceptor = (dispatch: Dispatcher["dispatch"]) => Dispatcher["dispatch"];

/** Masks sensitive query parameters (e.g. apiKey) from a URL path. */
const maskSensitiveParams = (url: string): string =>
  url.replaceAll(/([?&])(apiKey)=[^&]*/gi, "$1$2=***");

/** Formats a URL path for logging: masks secrets and decodes percent-encoded characters. */
const formatPath = (path: string): string => {
  try {
    return decodeURIComponent(maskSensitiveParams(path));
  } catch {
    return maskSensitiveParams(path);
  }
};

/**
 * Creates an undici interceptor that logs HTTP request start/end via consola.debug.
 *
 * Uses the undici v7 "new" handler API (onRequestStart, onResponseStart, etc.)
 * with a plain delegate object to avoid Proxy issues with private class fields.
 */
const createLoggingInterceptor = (): Interceptor => {
  let originLogged = false;

  return (dispatch) => (opts, handler) => {
    const origin = opts.origin?.toString() ?? "";
    if (!originLogged && origin) {
      consola.debug(`API host: ${origin}`);
      originLogged = true;
    }

    const method = opts.method ?? "UNKNOWN";
    const path = formatPath(opts.path ?? "");
    const start = performance.now();

    consola.debug(`→ ${method} ${path}`);

    return dispatch(opts, {
      onRequestStart(controller, context) {
        handler.onRequestStart?.(controller, context);
      },
      onRequestUpgrade(controller, statusCode, headers, socket) {
        handler.onRequestUpgrade?.(controller, statusCode, headers, socket);
      },
      onResponseStart(controller, statusCode, headers, statusMessage) {
        const elapsed = Math.round(performance.now() - start);
        consola.debug(`← ${statusCode} ${method} ${path} (${elapsed}ms)`);
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
        consola.debug(`✗ ${method} ${path} (${elapsed}ms)`);
        handler.onResponseError?.(controller, err);
      },
    });
  };
};

/** Installs the logging interceptor as the global fetch dispatcher. */
const installHttpLogger = (): void => {
  const agent = new Agent().compose(createLoggingInterceptor());
  setGlobalDispatcher(agent);
};

export { createLoggingInterceptor, installHttpLogger };
