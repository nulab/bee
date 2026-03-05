import { type Client, createClient } from "@repo/openapi-client/client";
import { refreshAccessToken } from "./oauth";
import { formatResetTime } from "./rate-limit";
import { resolveSpace, updateSpaceAuth } from "@repo/config";
import consola from "consola";
import { ofetch } from "ofetch";

/** The type of the authenticated API client. */
type BacklogClient = Client;

/** Adds a request interceptor that removes query parameters with empty values. */
const addEmptyQueryParamFilter = (client: Client): void => {
  client.interceptors.request.use((request) => {
    const url = new URL(request.url);
    for (const [key, value] of [...url.searchParams.entries()]) {
      if (value === "") {
        url.searchParams.delete(key);
      }
    }
    return new Request(url, request);
  });
};

/** Adds a request interceptor that sets the apiKey query parameter. */
const addApiKeyAuth = (client: Client, apiKey: string): void => {
  client.interceptors.request.use((request) => {
    const url = new URL(request.url);
    url.searchParams.set("apiKey", apiKey);
    return new Request(url, request);
  });
};

/** Adds a request interceptor that sets the Authorization Bearer header. */
const addBearerAuth = (client: Client, token: string): void => {
  client.interceptors.request.use((request) => {
    request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  });
};

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
    const baseUrl = `https://${resolved.host}/api/v2`;

    if (resolved.auth.method === "api-key") {
      const client = createClient({
        baseUrl,
        onResponseError: handleRateLimitError,
      });
      addEmptyQueryParamFilter(client);
      addApiKeyAuth(client, resolved.auth.apiKey);
      return { client, host: resolved.host };
    }

    // OAuth: Create client with automatic token refresh on 401
    return {
      client: createOAuthClient(baseUrl, resolved.host, resolved.auth),
      host: resolved.host,
    };
  }

  // Fallback: BACKLOG_API_KEY + BACKLOG_SPACE environment variables
  const envApiKey = process.env.BACKLOG_API_KEY;
  const envHost = process.env.BACKLOG_SPACE;

  if (envApiKey && envHost) {
    const client = createClient({
      baseUrl: `https://${envHost}/api/v2`,
      onResponseError: handleRateLimitError,
    });
    addEmptyQueryParamFilter(client);
    addApiKeyAuth(client, envApiKey);
    return { client, host: envHost };
  }

  consola.error("No space configured. Run `bl auth login` to authenticate.");
  return process.exit(1);
};

/**
 * Creates an OAuth-authenticated hey-api client with automatic 401 token refresh.
 *
 * Uses a custom ofetch instance that intercepts 401 responses, refreshes the
 * access token, and retries the original request.
 */
const createOAuthClient = (
  baseUrl: string,
  host: string,
  oauthAuth: {
    accessToken: string;
    refreshToken: string;
    clientId?: string;
    clientSecret?: string;
  },
): Client => {
  let currentAccessToken = oauthAuth.accessToken;
  let refreshPromise: Promise<void> | null = null;

  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    if (refreshPromise) {
      await refreshPromise;
      return currentAccessToken !== oauthAuth.accessToken;
    }

    const { clientId, clientSecret, refreshToken } = oauthAuth;

    if (!clientId || !clientSecret || !refreshToken) {
      consola.error(
        "OAuth credentials are incomplete. Run `bl auth login -m oauth` to re-authenticate.",
      );
      return false;
    }

    let succeeded = false;

    refreshPromise = (async () => {
      try {
        consola.start("Access token expired. Refreshing...");
        const tokenResponse = await refreshAccessToken(host, {
          clientId,
          clientSecret,
          refreshToken,
        });

        currentAccessToken = tokenResponse.access_token;

        updateSpaceAuth(host, {
          method: "oauth",
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          clientId,
          clientSecret,
        });

        consola.success("Token refreshed successfully.");
        succeeded = true;
      } catch {
        consola.error(
          "OAuth session has expired. Run `bl auth login -m oauth` to re-authenticate.",
        );
      }
    })();

    await refreshPromise;
    refreshPromise = null;
    return succeeded;
  };

  const customOfetch = ofetch.create({
    onResponseError: async ({ response }) => {
      handleRateLimitError({ response });

      if (response.status === 401) {
        const refreshed = await refreshTokenIfNeeded();
        if (!refreshed) {
          process.exit(1);
        }
      }
    },
    retry: 1,
    retryStatusCodes: [401],
  });

  const client = createClient({ baseUrl, ofetch: customOfetch });
  addEmptyQueryParamFilter(client);
  client.interceptors.request.use((request) => {
    request.headers.set("Authorization", `Bearer ${currentAccessToken}`);
    return request;
  });
  return client;
};

const handleRateLimitError = ({
  response,
}: {
  response: { status: number; headers: { get(name: string): string | null } };
}) => {
  if (response.status === 429) {
    const resetEpoch = response.headers.get("X-RateLimit-Reset");
    const resetMessage = resetEpoch
      ? `Rate limit resets at ${formatResetTime(Number(resetEpoch))}.`
      : "Please wait and try again later.";
    throw new Error(`API rate limit exceeded. ${resetMessage}`);
  }
};

export type { BacklogClient };
export { addApiKeyAuth, addBearerAuth, getClient };
