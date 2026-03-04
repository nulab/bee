using TypeSpec.Http;

namespace Backlog;

// ────────────────────────────────────────────
// OAuth2
// ────────────────────────────────────────────

model OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: int32;
  refresh_token: string;
}

model OAuthTokenRequest {
  grant_type: string;
  code?: string;
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  refresh_token?: string;
}

@route("/oauth2")
interface OAuth {
  @doc("""
    Starts the OAuth2 authorization code flow.
    The actual endpoint is https://{spaceKey}.backlog.com/OAuth2AccessRequest.action
    (not under /api/v2). The user is redirected to Backlog to authorize the application.
    """)
  @get
  @route("/authorize")
  authorize(
    @query response_type: "code",
    @query client_id: string,
    @query redirect_uri: string,
    @query state?: string,
  ): void;

  @doc("Exchanges an authorization code or refresh token for an access token.")
  @route("token")
  @post
  token(
    @header contentType: "application/x-www-form-urlencoded",
    @body body: OAuthTokenRequest,
  ): OAuthTokenResponse;
}
