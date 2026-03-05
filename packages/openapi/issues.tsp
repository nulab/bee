using TypeSpec.Http;

namespace Backlog;

// ────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────

/** Parent/child issue filter. */
enum ParentChildType {
  All: 0,
  ExcludeChild: 1,
  ChildOnly: 2,
  NeitherParentNorChild: 3,
  ParentOnly: 4,
}

/** Sort field for issue list. */
enum IssueSortField {
  id,
  project,
  issueType,
  category,
  version,
  milestone,
  summary,
  status,
  priority,
  attachment,
  sharedFile,
  created,
  createdUser,
  updated,
  updatedUser,
  assignee,
  startDate,
  dueDate,
  estimatedHours,
  actualHours,
  childIssue,
}

// ────────────────────────────────────────────
// Operations
// ────────────────────────────────────────────

@route("/issues")
@tag("Issues")
interface Issues {
  @summary("Get Issue List")
  @doc("Returns list of issues.")
  @get
  op list(
    @query("projectId[]") projectId?: int64[],
    @query("issueTypeId[]") issueTypeId?: int64[],
    @query("categoryId[]") categoryId?: int64[],
    @query("versionId[]") versionId?: int64[],
    @query("milestoneId[]") milestoneId?: int64[],
    @query("statusId[]") statusId?: int64[],
    @query("priorityId[]") priorityId?: int64[],
    @query("assigneeId[]") assigneeId?: int64[],
    @query("createdUserId[]") createdUserId?: int64[],
    @query("resolutionId[]") resolutionId?: int64[],
    @query parentChild?: ParentChildType,
    @query attachment?: boolean,
    @query sharedFile?: boolean,
    @query sort?: IssueSortField,
    @query order?: "asc" | "desc",
    @query offset?: int32,
    @query count?: int32,
    @query createdSince?: string,
    @query createdUntil?: string,
    @query updatedSince?: string,
    @query updatedUntil?: string,
    @query startDateSince?: string,
    @query startDateUntil?: string,
    @query dueDateSince?: string,
    @query dueDateUntil?: string,
    @query("id[]") id?: int64[],
    @query("parentIssueId[]") parentIssueId?: int64[],
    @query keyword?: string,
  ): Issue[] | BacklogErrorResponse;

  @summary("Count Issue")
  @doc("Returns number of issues.")
  @get
  @route("/count")
  op count(
    @query("projectId[]") projectId?: int64[],
    @query("issueTypeId[]") issueTypeId?: int64[],
    @query("categoryId[]") categoryId?: int64[],
    @query("versionId[]") versionId?: int64[],
    @query("milestoneId[]") milestoneId?: int64[],
    @query("statusId[]") statusId?: int64[],
    @query("priorityId[]") priorityId?: int64[],
    @query("assigneeId[]") assigneeId?: int64[],
    @query("createdUserId[]") createdUserId?: int64[],
    @query("resolutionId[]") resolutionId?: int64[],
    @query parentChild?: ParentChildType,
    @query attachment?: boolean,
    @query sharedFile?: boolean,
    @query sort?: IssueSortField,
    @query order?: "asc" | "desc",
    @query offset?: int32,
    @query count?: int32,
    @query createdSince?: string,
    @query createdUntil?: string,
    @query updatedSince?: string,
    @query updatedUntil?: string,
    @query startDateSince?: string,
    @query startDateUntil?: string,
    @query dueDateSince?: string,
    @query dueDateUntil?: string,
    @query("id[]") id?: int64[],
    @query("parentIssueId[]") parentIssueId?: int64[],
    @query keyword?: string,
  ): IssueCount | BacklogErrorResponse;

  @summary("Get Issue")
  @doc("Returns information about issue.")
  @get
  @route("/{issueIdOrKey}")
  op get(
    @path issueIdOrKey: string,
  ): Issue | BacklogErrorResponse;

  @summary("Get Comment List")
  @doc("Returns list of comments in issue.")
  @get
  @route("/{issueIdOrKey}/comments")
  op getComments(
    @path issueIdOrKey: string,
    @query minId?: int64,
    @query maxId?: int64,
    @query count?: int32,
    @query order?: "asc" | "desc",
  ): Comment[] | BacklogErrorResponse;
}
