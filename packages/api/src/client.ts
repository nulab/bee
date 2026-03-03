import { setTimeout } from "node:timers/promises";
import type { $Fetch } from "ofetch";
import { ofetch } from "ofetch";
import { joinURL } from "ufo";
import {
  BacklogRateLimitError,
  formatResetTime,
  MAX_RATE_LIMIT_WAIT_MS,
  RATE_LIMIT_BUFFER_MS,
} from "#/rate-limit.js";

type BacklogClientConfig = {
  host: string;
  apiKey?: string;
  accessToken?: string | (() => string);
  rateLimitRetry?: boolean;
};

const createClient = (config: BacklogClientConfig): $Fetch => {
  const rateLimitRetry = config.rateLimitRetry ?? true;

  let headers: Record<string, string> = {};
  if (config.accessToken) {
    if (typeof config.accessToken === "function") {
      const getToken = config.accessToken;
      headers = {
        get Authorization() {
          return `Bearer ${getToken()}`;
        },
      };
    } else {
      headers = { Authorization: `Bearer ${config.accessToken}` };
    }
  }

  const baseFetch = ofetch.create({
    baseURL: joinURL(`https://${config.host}`, "/api/v2"),
    headers,
    query: config.apiKey ? { apiKey: config.apiKey } : {},
    onResponseError({ response }) {
      if (response.status === 429) {
        const resetEpoch = response.headers.get("X-RateLimit-Reset");
        const resetAt = resetEpoch ? new Date(Number(resetEpoch) * 1000) : undefined;
        const resetMessage = resetAt
          ? `Rate limit resets at ${formatResetTime(Number(resetEpoch))}.`
          : "Please wait and try again later.";

        throw new BacklogRateLimitError(`API rate limit exceeded. ${resetMessage}`, resetAt);
      }
    },
  });

  if (!rateLimitRetry) {
    return baseFetch;
  }

  return (async (url: string, options?: Record<string, unknown>) => {
    try {
      return await baseFetch(url, options);
    } catch (error) {
      if (error instanceof BacklogRateLimitError && error.resetAt) {
        const delay = error.resetAt.getTime() - Date.now();
        if (delay > 0 && delay <= MAX_RATE_LIMIT_WAIT_MS) {
          await setTimeout(delay + RATE_LIMIT_BUFFER_MS);
          const retryResult = await baseFetch(url, options);
          return retryResult;
        }
      }
      throw error;
    }
  }) as $Fetch;
};

export { createClient };
export type { BacklogClientConfig };
