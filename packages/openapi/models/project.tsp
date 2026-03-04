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
  useSubversion: boolean;
  useGit: boolean;
  useOriginalImageSizeAtWiki: boolean;
  textFormattingRule: "backlog" | "markdown";
  archived: boolean;
  displayOrder: int32;
  useDevAttributes: boolean;
}
