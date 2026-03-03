import type { $Fetch } from "ofetch";
import { ofetch } from "ofetch";
import { joinURL } from "ufo";
import { BacklogRateLimitError, formatResetTime } from "#/rate-limit.js";

export type BacklogClientConfig = {
  host: string;
  apiKey?: string;
  accessToken?: string;
};

export const createClient = (config: BacklogClientConfig): $Fetch =>
  ofetch.create({
    baseURL: joinURL(`https://${config.host}`, "/api/v2"),
    headers: config.accessToken ? { Authorization: `Bearer ${config.accessToken}` } : {},
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
