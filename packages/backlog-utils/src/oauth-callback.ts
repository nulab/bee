import { createServer } from 'node:http';
import type { Server, ServerResponse } from 'node:http';

/** 5 minutes in milliseconds */
const CALLBACK_TIMEOUT_MS = 300_000;
const CALLBACK_PORT = 5033;

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

export type CallbackServer = {
	port: number;
	waitForCallback: (expectedState: string) => Promise<string>;
	stop: () => void;
};

function respondHtml(res: ServerResponse, html: string, statusCode = 200): void {
	res.writeHead(statusCode, { "Content-Type": "text/html" });
	res.end(html);
}

/**
 * Starts a local HTTP server to receive the OAuth callback.
 *
 * Listens on port 5033 (Nulab's stock code).
 */
export function startCallbackServer(): CallbackServer {
	let resolveCode: ((code: string) => void) | null = null;
	let rejectCode: ((error: Error) => void) | null = null;

	const server: Server = createServer((req, res) => {
		const url = new URL(req.url ?? "/", `http://localhost:${CALLBACK_PORT}`);

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

		resolveCode?.(`${code}:${state}`);
		respondHtml(res, SUCCESS_HTML);
	});

	server.listen(CALLBACK_PORT);

	return {
		port: CALLBACK_PORT,
		waitForCallback(expectedState: string): Promise<string> {
			return new Promise<string>((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error("OAuth callback timed out after 5 minutes"));
					server.close();
				}, CALLBACK_TIMEOUT_MS);

				resolveCode = (codeAndState: string) => {
					clearTimeout(timeout);
					const separatorIndex = codeAndState.indexOf(":");
					const code = codeAndState.slice(0, separatorIndex);
					const state = codeAndState.slice(separatorIndex + 1);
					if (state === expectedState) {
						resolve(code);
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
}
