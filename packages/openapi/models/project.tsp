namespace Backlog;

/** Backlog project. */
model Project {
  id: int64;
  projectKey: string;
  name: string;
  chartEnabled: boolean;
  useResolvedForChart: boolean;
  subtaskingEnabled: boolean;
  projectLeaderCanEditProjectLeader: boolean;
  useWiki: boolean;
  useDocument: boolean;
  useFileSharing: boolean;
  useWikiTreeView: boolean;
  useSubversion?: boolean;
  useGit?: boolean;
  useOriginalImageSizeAtWiki: boolean;
  textFormattingRule: TextFormattingRule | null;
  archived: boolean;
  displayOrder: int32;
  useDevAttributes: boolean;
}

/** Request body for Add Project. */
model AddProjectRequest {
  @doc("Project Name")
  name: string;

  @doc("Project Key (Uppercase letters (A-Z), numbers (0-9) and underscore (_) can be used.)")
  key: string;

  @doc("Enable chart")
  chartEnabled?: boolean;

  @doc("Consider Resolved and statuses after as Closed")
  useResolvedForChart?: boolean;

  @doc("Enable subtasking")
  subtaskingEnabled?: boolean;

  @doc("Allow project administrators to manage each other")
  projectLeaderCanEditProjectLeader?: boolean;

  @doc("Enable Wiki")
  useWiki?: boolean;

  @doc("Enable shared files")
  useFileSharing?: boolean;

  @doc("Enable Wiki tree view")
  useWikiTreeView?: boolean;

  @doc("Enable Subversion")
  useSubversion?: boolean;

  @doc("Enable Git")
  useGit?: boolean;

  @doc("Display images in Wikis in their original size")
  useOriginalImageSizeAtWiki?: boolean;

  @doc("Formatting rules. {backlog|markdown}")
  textFormattingRule?: TextFormattingRule;

  @doc("Enable priorities, versions and milestones")
  useDevAttributes?: boolean;
}

/** Request body for Update Project. */
model UpdateProjectRequest {
  @doc("Project Name")
  name?: string;

  @doc("Project Key")
  key?: string;

  @doc("Enable chart")
  chartEnabled?: boolean;

  @doc("Consider Resolved and statuses after as Closed")
  useResolvedForChart?: boolean;

  @doc("Enable subtasking")
  subtaskingEnabled?: boolean;

  @doc("Allow project administrators to manage each other")
  projectLeaderCanEditProjectLeader?: boolean;

  @doc("Enable Wiki")
  useWiki?: boolean;

  @doc("Enable shared files")
  useFileSharing?: boolean;

  @doc("Enable Wiki tree view")
  useWikiTreeView?: boolean;

  @doc("Enable Subversion")
  useSubversion?: boolean;

  @doc("Enable Git")
  useGit?: boolean;

  @doc("Display images in Wikis in their original size")
  useOriginalImageSizeAtWiki?: boolean;

  @doc("Formatting rules. {backlog|markdown}")
  textFormattingRule?: TextFormattingRule;

  @doc("Archive project")
  archived?: boolean;

  @doc("Enable priorities, versions and milestones")
  useDevAttributes?: boolean;
}

/** Request body for Add Project User. */
model AddProjectUserRequest {
  @doc("User ID")
  userId: int64;
}

/** Request body for Delete Project User. */
model DeleteProjectUserRequest {
  @doc("User ID")
  userId: int64;
}
