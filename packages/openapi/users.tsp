using TypeSpec.Http;

namespace Backlog;

// ────────────────────────────────────────────
// Operations
// ────────────────────────────────────────────

@route("/users")
@tag("Users")
interface Users {
  @summary("Get own user information")
  @get
  @route("/myself")
  op getMyself(): User | BacklogErrorResponse;
}
