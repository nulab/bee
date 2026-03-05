import { OAuth2 } from "backlog-js";

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
  const oauth2 = new OAuth2({
    clientId: params.clientId,
    clientSecret: params.clientSecret,
  });
  return oauth2.getAccessToken({
    host,
    code: params.code,
    redirectUri: params.redirectUri,
  });
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
  const oauth2 = new OAuth2({
    clientId: params.clientId,
    clientSecret: params.clientSecret,
  });
  return oauth2.refreshAccessToken({
    host,
    refreshToken: params.refreshToken,
  });
};

export { exchangeAuthorizationCode, refreshAccessToken };
export type { OAuthTokenResponse };
