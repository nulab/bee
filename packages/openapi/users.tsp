using TypeSpec.Http;

namespace Backlog;

// ────────────────────────────────────────────
// Operations
// ────────────────────────────────────────────

@route("/users")
@tag("Users")
interface Users {
  @summary("Get Own User")
  @doc("Returns own information about user.")
  @get
  @route("/myself")
  op getMyself(): User | BacklogErrorResponse;
}
