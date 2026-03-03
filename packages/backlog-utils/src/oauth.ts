import { createClient } from "@repo/openapi-client/client";
import { oAuthToken } from "@repo/openapi-client";

/**
 * OAuth token response from Backlog API.
 * Locally defined to avoid oxlint type resolution issues with generated code.
 */
type OAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
};

/**
 * Exchanges an authorization code for an OAuth token pair.
 */
const exchangeAuthorizationCode = async (
  host: string,
  params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  },
): Promise<OAuthTokenResponse> => {
  const client = createClient({ baseUrl: `https://${host}/api/v2` });
  const { data } = await oAuthToken({
    client,
    throwOnError: true,
    body: {
      grant_type: "authorization_code",
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
    },
  });
  return data;
};

/**
 * Refreshes an OAuth access token using a refresh token.
 */
const refreshAccessToken = async (
  host: string,
  params: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  },
): Promise<OAuthTokenResponse> => {
  const client = createClient({ baseUrl: `https://${host}/api/v2` });
  const { data } = await oAuthToken({
    client,
    throwOnError: true,
    body: {
      grant_type: "refresh_token",
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
    },
  });
  return data;
};

export { exchangeAuthorizationCode, refreshAccessToken };
export type { OAuthTokenResponse };
