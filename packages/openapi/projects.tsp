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

  @summary("Add Project")
  @doc("Adds a new project.")
  @post
  op create(
    @header contentType: "application/x-www-form-urlencoded",
    @body body: AddProjectRequest,
  ): Project | BacklogErrorResponse;

  @summary("Update Project")
  @doc("Updates information about project.")
  @patch(#{implicitOptionality: true})
  @route("/{projectIdOrKey}")
  op update(
    @path projectIdOrKey: string,
    @header contentType: "application/x-www-form-urlencoded",
    @body body: UpdateProjectRequest,
  ): Project | BacklogErrorResponse;

  @summary("Delete Project")
  @doc("Deletes project.")
  @delete
  @route("/{projectIdOrKey}")
  op delete(@path projectIdOrKey: string): Project | BacklogErrorResponse;

  @summary("Add Project User")
  @doc("Adds user to list of project members.")
  @post
  @route("/{projectIdOrKey}/users")
  op addUser(
    @path projectIdOrKey: string,
    @header contentType: "application/x-www-form-urlencoded",
    @body body: AddProjectUserRequest,
  ): User | BacklogErrorResponse;

  @summary("Delete Project User")
  @doc("Removes user from list of project members.")
  @delete
  @route("/{projectIdOrKey}/users")
  op deleteUser(
    @path projectIdOrKey: string,
    @header contentType: "application/x-www-form-urlencoded",
    @body body: DeleteProjectUserRequest,
  ): User | BacklogErrorResponse;
}
