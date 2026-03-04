using TypeSpec.Http;

namespace Backlog;

// ────────────────────────────────────────────
// Operations
// ────────────────────────────────────────────

@route("/projects")
@tag("Projects")
interface Projects {
  @summary("Get Project List")
  @doc("Returns list of projects.")
  @get
  op list(
    @query archived?: boolean,
    @query all?: boolean,
  ): Project[] | BacklogErrorResponse;

  @summary("Get Project")
  @doc("Returns information about project.")
  @get
  @route("/{projectIdOrKey}")
  op get(
    @path projectIdOrKey: string,
  ): Project | BacklogErrorResponse;

  @summary("Get Project User List")
  @doc("Returns list of project members.")
  @get
  @route("/{projectIdOrKey}/users")
  op getUsers(
    @path projectIdOrKey: string,
    @query excludeGroupMembers?: boolean,
  ): User[] | BacklogErrorResponse;

  @summary("Get Project Recent Updates")
  @doc("Returns recent update activities of the project.")
  @get
  @route("/{projectIdOrKey}/activities")
  op getActivities(
    @path projectIdOrKey: string,
    @query("activityTypeId[]") activityTypeId?: int32[],
    @query minId?: int64,
    @query maxId?: int64,
    @query count?: int32,
    @query order?: "asc" | "desc",
  ): Activity[] | BacklogErrorResponse;
}
