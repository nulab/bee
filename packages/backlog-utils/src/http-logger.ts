import consola from "consola";
import { Agent, type Dispatcher, setGlobalDispatcher } from "undici";

type Interceptor = (dispatch: Dispatcher["dispatch"]) => Dispatcher["dispatch"];

/** Creates an undici interceptor that logs HTTP request start/end via consola.debug. */
const createLoggingInterceptor = (): Interceptor => (dispatch) => (opts, handler) => {
    const method = opts.method ?? "UNKNOWN";
    const url = `${opts.origin ?? ""}${opts.path ?? ""}`;
    const start = performance.now();

    consola.debug(`[backlog] → ${method} ${url}`);

    const wrappedHandler = new Proxy(handler, {
      get(target, prop, receiver) {
        if (prop === "onHeaders") {
          return (
            statusCode: number,
            headers: Buffer[] | string[] | null,
            resume: () => void,
            statusText: string,
          ) => {
            const elapsed = Math.round(performance.now() - start);
            consola.debug(`[backlog] ← ${statusCode} ${method} ${url} (${elapsed}ms)`);
            return target.onHeaders(statusCode, headers, resume, statusText);
          };
        }
        if (prop === "onError") {
          return (error: Error) => {
            const elapsed = Math.round(performance.now() - start);
            consola.debug(`[backlog] ✗ ${method} ${url} (${elapsed}ms)`);
            return target.onError(error);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    return dispatch(opts, wrappedHandler);
  };

/** Installs the logging interceptor as the global fetch dispatcher. */
const installHttpLogger = (): void => {
  const agent = new Agent().compose(createLoggingInterceptor());
  setGlobalDispatcher(agent);
};

export { createLoggingInterceptor, installHttpLogger };
