import { UserError } from "@repo/cli-utils";
import { Backlog } from "backlog-js";
import { refreshAccessToken } from "./oauth";
import { formatResetTime } from "./rate-limit";
import { resolveSpace, updateSpaceAuth } from "@repo/config";
import consola from "consola";

/** The type of the authenticated API client. */
type BacklogClient = Backlog;

/**
 * Resolves the active space and creates an authenticated API client.
 *
 * Authentication is resolved in priority order:
 * 1. Configured space (via BACKLOG_SPACE env or defaultSpace in config)
 * 2. BACKLOG_API_KEY + BACKLOG_SPACE environment variables (lowest priority fallback)
 *
 * For OAuth authentication, automatically refreshes the access token when it expires (401 error).
 *
 * @returns The authenticated client and host string.
 */
const getClient = async (): Promise<{
  client: BacklogClient;
  host: string;
}> => {
  const resolved = resolveSpace();

  if (resolved) {
    if (resolved.auth.method === "api-key") {
      const client = new Backlog({
        host: resolved.host,
        apiKey: resolved.auth.apiKey,
      });
      return { client, host: resolved.host };
    }

    // OAuth: Create client with automatic token refresh on 401
    return {
      client: createOAuthClient(resolved.host, resolved.auth),
      host: resolved.host,
    };
  }

  // Fallback: BACKLOG_API_KEY + BACKLOG_SPACE environment variables
  const envApiKey = process.env.BACKLOG_API_KEY;
  const envHost = process.env.BACKLOG_SPACE;

  if (envApiKey && envHost) {
    const client = new Backlog({ host: envHost, apiKey: envApiKey });
    return { client, host: envHost };
  }

  throw new UserError("No space configured. Run `bee auth login` to authenticate.");
};

/**
 * Creates an OAuth-authenticated Backlog client with automatic 401 token refresh.
 *
 * Uses a Proxy that intercepts method calls and retries on 401 after refreshing
 * the access token.
 */
const createOAuthClient = (
  host: string,
  oauthAuth: {
    accessToken: string;
    refreshToken: string;
    clientId?: string;
    clientSecret?: string;
  },
): Backlog => {
  let currentClient = new Backlog({ host, accessToken: oauthAuth.accessToken });
  let refreshPromise: Promise<boolean> | null = null;

  const refreshTokenIfNeeded = async (): Promise<void> => {
    if (refreshPromise) {
      const result = await refreshPromise;
      if (!result) {
        throw new UserError(
          "OAuth session has expired. Run `bee auth login -m oauth` to re-authenticate.",
        );
      }
      return;
    }

    const { clientId, clientSecret, refreshToken } = oauthAuth;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new UserError(
        "OAuth credentials are incomplete. Run `bee auth login -m oauth` to re-authenticate.",
      );
    }

    refreshPromise = (async () => {
      try {
        consola.start("Access token expired. Refreshing...");
        const tokenResponse = await refreshAccessToken(host, {
          clientId,
          clientSecret,
          refreshToken,
        });

        currentClient = new Backlog({
          host,
          accessToken: tokenResponse.access_token,
        });

        updateSpaceAuth(host, {
          method: "oauth",
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          clientId,
          clientSecret,
        });

        consola.success("Token refreshed successfully.");
        return true;
      } catch {
        return false;
      }
    })();

    const result = await refreshPromise;
    refreshPromise = null;
    if (!result) {
      throw new UserError(
        "OAuth session has expired. Run `bee auth login -m oauth` to re-authenticate.",
      );
    }
  };

  const proxy = new Proxy(currentClient, {
    get(_target, prop, receiver) {
      const value = Reflect.get(currentClient, prop, receiver);
      if (typeof value !== "function") {
        return value;
      }
      return async (...args: unknown[]) => {
        try {
          return await value.apply(currentClient, args);
        } catch (error) {
          handleRateLimitError(error);

          if (isBacklogAuthError(error)) {
            await refreshTokenIfNeeded();
            // Retry with the new client
            const retryValue = Reflect.get(currentClient, prop, receiver);
            return await (retryValue as (...a: unknown[]) => unknown).apply(currentClient, args);
          }

          throw error;
        }
      };
    },
  });

  return proxy;
};

/**
 * Duck-typing check for backlog-js auth errors.
 *
 * backlog-js compiles classes to ES5, so `instanceof` doesn't work
 * across CJS/ESM boundaries. We check `_name` and `_status` instead.
 */
const isBacklogAuthError = (error: unknown): boolean =>
  error instanceof Error &&
  (error as Record<string, unknown>)._name === "BacklogAuthError" &&
  (error as Record<string, unknown>)._status === 401;

const isBacklogRateLimitError = (error: unknown): error is Error & { _response: Response } =>
  error instanceof Error &&
  (error as Record<string, unknown>)._name === "BacklogApiError" &&
  (error as Record<string, unknown>)._status === 429;

const handleRateLimitError = (error: unknown): void => {
  if (isBacklogRateLimitError(error)) {
    const resetEpoch = error._response.headers.get("X-RateLimit-Reset");
    const resetMessage = resetEpoch
      ? `Rate limit resets at ${formatResetTime(Number(resetEpoch))}.`
      : "Please wait and try again later.";
    throw new UserError(`API rate limit exceeded. ${resetMessage}`);
  }
};

export type { BacklogClient };
export { getClient };
