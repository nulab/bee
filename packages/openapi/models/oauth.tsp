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
  @route("token")
  @post
  token(
    @header contentType: "application/x-www-form-urlencoded",
    @body body: OAuthTokenRequest,
  ): OAuthTokenResponse;
}
