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
namespace Backlog;
