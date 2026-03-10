import { type AddressInfo, type Server, type ServerResponse, createServer } from "node:http";

/** 5 minutes in milliseconds */
const CALLBACK_TIMEOUT_MS = 300_000;
const DEFAULT_CALLBACK_PORT = 5033;

const SUCCESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Authentication Successful</title></head>
<body style="font-family:system-ui;text-align:center;padding:2em">
<h1>Authentication Successful</h1>
<p>You can close this window and return to the terminal.</p>
</body></html>`;

const ERROR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Authentication Failed</title></head>
<body style="font-family:system-ui;text-align:center;padding:2em">
<h1>Authentication Failed</h1>
<p>Something went wrong. Please try again.</p>
</body></html>`;

type CallbackResult = {
  code: string;
  state: string;
};

type CallbackServer = {
  port: number;
  waitForCallback: (expectedState: string) => Promise<string>;
  stop: () => void;
};

const respondHtml = (res: ServerResponse, html: string, statusCode = 200): void => {
  res.writeHead(statusCode, { "Content-Type": "text/html" });
  res.end(html);
};

/**
 * Starts a local HTTP server to receive the OAuth callback.
 *
 * Listens on the given port (defaults to 5033, Nulab's stock code).
 * Pass `0` to let the OS pick an available port.
 */
const startCallbackServer = (port: number = DEFAULT_CALLBACK_PORT): CallbackServer => {
  let resolveCode: ((result: CallbackResult) => void) | null = null;
  let rejectCode: ((error: Error) => void) | null = null;

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${actualPort}`);

    if (url.pathname !== "/callback") {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      rejectCode?.(new Error(`OAuth error: ${error}`));
      respondHtml(res, ERROR_HTML);
      return;
    }

    if (!code || !state) {
      rejectCode?.(new Error("Missing code or state parameter"));
      respondHtml(res, ERROR_HTML);
      return;
    }

    resolveCode?.({ code, state });
    respondHtml(res, SUCCESS_HTML);
  });

  server.listen(port);
  const actualPort = (server.address() as AddressInfo).port;

  return {
    port: actualPort,
    waitForCallback(expectedState: string): Promise<string> {
      return new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("OAuth callback timed out after 5 minutes"));
          server.close();
        }, CALLBACK_TIMEOUT_MS);

        resolveCode = (result: CallbackResult) => {
          clearTimeout(timeout);
          if (result.state === expectedState) {
            resolve(result.code);
          } else {
            reject(new Error("OAuth state mismatch — possible CSRF attack"));
          }
        };

        rejectCode = (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    },
    stop() {
      server.close();
    },
  };
};

export type { CallbackServer };
export { startCallbackServer };
