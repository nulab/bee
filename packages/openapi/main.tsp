import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

import "./models";
import "./users.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Backlog API" })
@server("https://{spaceKey}.backlog.com/api/v2", "Backlog API (.com)", {
  spaceKey: string,
})
@server("https://{spaceKey}.backlog.jp/api/v2", "Backlog API (.jp)", {
  spaceKey: string,
})
@useAuth(ApiKeyAuth<ApiKeyLocation.query, "apiKey"> | BearerAuth)
@tagMetadata(
  "OAuth 2.0",
  #{
    description: """
      You can access the Backlog API by using the "Authorization Code Grant" defined in "The OAuth 2.0 Authorization Framework" (RFC 6749).

      Register your application in the [Backlog Developer Site](https://backlog.com/developer/applications/) first to obtain your client_id and client_secret.
      """,
  }
)
namespace Backlog;
