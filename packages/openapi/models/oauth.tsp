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

@doc("""
  OAuth2 Authorization endpoint.
  Note: This endpoint is served at the domain root, not under /api/v2.
  The full URL is https://{spaceKey}.backlog.com/OAuth2AccessRequest.action
  """)
@route("/OAuth2AccessRequest.action")
interface OAuthAuthorization {
  @doc("""
    Redirects the user to the Backlog authorization page.
    After the user grants access, Backlog redirects back to the redirect_uri
    with an authorization code as a query parameter.
    """)
  @get
  authorize(
    @query response_type: "code",
    @query client_id: string,
    @query redirect_uri: string,
    @query state?: string,
  ): void;
}

@route("/oauth2")
interface OAuth {
  @doc("""
    Exchanges an authorization code or refresh token for an access token.

    When grant_type is "authorization_code", provide code, redirect_uri,
    client_id, and client_secret to obtain initial tokens.

    When grant_type is "refresh_token", provide refresh_token, client_id,
    and client_secret to refresh an expired access token.
    """)
  @route("token")
  @post
  token(
    @header contentType: "application/x-www-form-urlencoded",
    @body body: OAuthTokenRequest,
  ): OAuthTokenResponse;
}
