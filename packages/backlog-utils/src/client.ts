import type { $Fetch } from "@repo/api";
import { createClient, formatResetTime, refreshAccessToken } from "@repo/api";
import { resolveSpace, updateSpaceAuth } from "@repo/config";
import consola from "consola";
import type { FetchOptions } from "ofetch";
import { ofetch } from "ofetch";
import { joinURL } from "ufo";

/** The type of the authenticated API client. */
export type BacklogClient = $Fetch;

/**
 * Resolves the active space and creates an authenticated API client.
 *
 * Authentication is resolved in priority order:
 * 1. Configured space (via --space flag, BACKLOG_SPACE env, or defaultSpace)
 * 2. BACKLOG_API_KEY + BACKLOG_SPACE environment variables (lowest priority fallback)
 *
 * For OAuth authentication, automatically refreshes the access token when it expires (401 error).
 *
 * @param space - Optional explicit space hostname (--space flag).
 * @returns The authenticated client and host string.
 */
export async function getClient(space?: string): Promise<{
  client: BacklogClient;
  host: string;
}> {
  const resolved = resolveSpace(space);

  if (resolved) {
    if (resolved.auth.method === "api-key") {
      return {
        client: createClient({ host: resolved.host, apiKey: resolved.auth.apiKey }),
        host: resolved.host,
      };
    }

    // OAuth: Create client with automatic token refresh on 401
    if (resolved.auth.method !== "oauth") {
      throw new Error("Expected OAuth authentication");
    }

    const oauthAuth = resolved.auth;
    let currentAccessToken = oauthAuth.accessToken;
    let refreshPromise: Promise<void> | null = null;

    // Helper to refresh the token. Returns true if refresh succeeded, false if it failed.
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
          const tokenResponse = await refreshAccessToken({
            host: resolved.host,
            refreshToken,
            clientId,
            clientSecret,
          });

          currentAccessToken = tokenResponse.access_token;

          updateSpaceAuth(resolved.host, {
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
        } finally {
          refreshPromise = null;
        }
      })();

      await refreshPromise;
      return succeeded;
    };

    // Create base client
    const baseClient = ofetch.create({
      baseURL: joinURL(`https://${resolved.host}`, "/api/v2"),
      headers: {
        get Authorization() {
          return `Bearer ${currentAccessToken}`;
        },
      },
      onResponseError({ response }) {
        // Handle rate limiting
        if (response.status === 429) {
          const resetEpoch = response.headers.get("X-RateLimit-Reset");
          const resetMessage = resetEpoch
            ? `Rate limit resets at ${formatResetTime(Number(resetEpoch))}.`
            : "Please wait and try again later.";
          throw new Error(`API rate limit exceeded. ${resetMessage}`);
        }
      },
    });

    // Wrap client to handle 401 and retry with refreshed token
    const client = (async (url: string, options?: FetchOptions) => {
      try {
        return await baseClient(url, options);
      } catch (error: unknown) {
        // Check if it's a 401 error
        if (error && typeof error === "object" && "status" in error && error.status === 401) {
          const refreshed = await refreshTokenIfNeeded();
          if (!refreshed) {
            return process.exit(1);
          }
          // Retry with new token
          return await baseClient(url, options);
        }
        throw error;
      }
    }) as $Fetch;

    return {
      client,
      host: resolved.host,
    };
  }

  // Fallback: BACKLOG_API_KEY + BACKLOG_SPACE environment variables
  const envApiKey = process.env["BACKLOG_API_KEY"];
  const envHost = space ?? process.env["BACKLOG_SPACE"];

  if (envApiKey && envHost) {
    return {
      client: createClient({ host: envHost, apiKey: envApiKey }),
      host: envHost,
    };
  }

  consola.error("No space configured. Run `bl auth login` to authenticate.");
  return process.exit(1);
}
