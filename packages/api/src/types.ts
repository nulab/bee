type BacklogUser = {
  id: number;
  userId: string;
  name: string;
  roleType: number;
  lang: string | null;
  mailAddress: string;
  lastLoginTime: string | null;
};

type BacklogProject = {
  id: number;
  projectKey: string;
  name: string;
  chartEnabled: boolean;
  useResolvedForChart: boolean;
  subtaskingEnabled: boolean;
  projectLeaderCanEditProjectLeader: boolean;
  useWiki: boolean;
  useFileSharing: boolean;
  useWikiTreeView: boolean;
  useOriginalImageSizeAtWiki: boolean;
  textFormattingRule: "backlog" | "markdown";
  archived: boolean;
  displayOrder: number;
  useDevAttributes: boolean;
};

type BacklogStatus = {
  id: number;
  projectId: number;
  name: string;
  color: string;
  displayOrder: number;
};

type BacklogIssueType = {
  id: number;
  projectId: number;
  name: string;
  color: string;
  displayOrder: number;
  templateSummary: string | null;
  templateDescription: string | null;
};

type BacklogPriority = {
  id: number;
  name: string;
};

type BacklogIssue = {
  id: number;
  projectId: number;
  issueKey: string;
  keyId: number;
  issueType: BacklogIssueType;
  summary: string;
  description: string;
  priority: BacklogPriority;
  status: BacklogStatus;
  assignee: BacklogUser | null;
  category: { id: number; name: string }[];
  versions: { id: number; name: string }[];
  milestone: { id: number; name: string }[];
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  parentIssueId: number | null;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

type BacklogChangeLog = {
  field: string;
  newValue: string | null;
  originalValue: string | null;
  attachmentInfo: { id: number; name: string } | null;
  attributeInfo: { id: number; typeId: string } | null;
  notificationInfo: { type: string } | null;
};

type BacklogCommentNotification = {
  id: number;
  alreadyRead: boolean;
  reason: number;
  user: BacklogUser;
  resourceAlreadyRead: boolean;
};

type BacklogSharedFile = {
  id: number;
  type: string;
  dir: string;
  name: string;
  size: number;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

type BacklogStar = {
  id: number;
  comment: string | null;
  url: string;
  title: string;
  presenter: BacklogUser;
  created: string;
};

type BacklogComment = {
  id: number;
  content: string;
  changeLog: BacklogChangeLog[];
  createdUser: BacklogUser;
  created: string;
  updated: string;
  stars: BacklogStar[];
  notifications: BacklogCommentNotification[];
};

type BacklogResolution = {
  id: number;
  name: string;
};

type BacklogActivity = {
  id: number;
  project: BacklogProject;
  type: number;
  content: Record<string, unknown>;
  notifications: BacklogCommentNotification[];
  createdUser: BacklogUser;
  created: string;
};

type BacklogSpace = {
  spaceKey: string;
  name: string;
  ownerId: number;
  lang: string;
  timezone: string;
  reportSendTime: string;
  textFormattingRule: "backlog" | "markdown";
  created: string;
  updated: string;
};

type BacklogRepository = {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  hookUrl: string | null;
  httpUrl: string;
  sshUrl: string;
  displayOrder: number;
  pushedAt: string | null;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

type BacklogPullRequestStatus = {
  id: number;
  name: string;
};

type BacklogPullRequest = {
  id: number;
  projectId: number;
  repositoryId: number;
  number: number;
  summary: string;
  description: string;
  base: string;
  branch: string;
  status: BacklogPullRequestStatus;
  assignee: BacklogUser | null;
  issue: BacklogIssue | null;
  baseCommit: string | null;
  branchCommit: string | null;
  mergeCommit: string | null;
  closeAt: string | null;
  mergeAt: string | null;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

const PRIORITY = {
  High: 2,
  Normal: 3,
  Low: 4,
} as const;

const DEFAULT_PRIORITY_ID = PRIORITY.Normal;

const RESOLUTION = {
  Fixed: 0,
  WontFix: 1,
  Invalid: 2,
  Duplicate: 3,
  CannotReproduce: 4,
} as const;

const PR_STATUS = {
  Open: 1,
  Closed: 2,
  Merged: 3,
} as const;

type BacklogPullRequestComment = {
  id: number;
  content: string;
  changeLog: BacklogChangeLog[];
  createdUser: BacklogUser;
  created: string;
  updated: string;
  stars: BacklogStar[];
  notifications: BacklogCommentNotification[];
};

type BacklogNotification = {
  id: number;
  alreadyRead: boolean;
  reason: number;
  resourceAlreadyRead: boolean;
  project: BacklogProject;
  issue?: BacklogIssue;
  comment?: BacklogComment;
  pullRequest?: BacklogPullRequest;
  sender: BacklogUser;
  created: string;
};

type BacklogNotificationCount = {
  count: number;
};

type BacklogWikiAttachment = {
  id: number;
  name: string;
  size: number;
  createdUser: BacklogUser;
  created: string;
};

type BacklogWiki = {
  id: number;
  projectId: number;
  name: string;
  content: string;
  tags: { id: number; name: string }[];
  attachments: BacklogWikiAttachment[];
  sharedFiles: BacklogSharedFile[];
  stars: BacklogStar[];
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

type BacklogWikiTag = {
  id: number;
  name: string;
};

type BacklogWikiHistory = {
  pageId: number;
  version: number;
  name: string;
  content: string;
  createdUser: BacklogUser;
  created: string;
};

type BacklogWikiCount = {
  count: number;
};

type BacklogTeam = {
  id: number;
  name: string;
  members: BacklogUser[];
  displayOrder: number | null;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

type BacklogCategory = {
  id: number;
  name: string;
  displayOrder: number;
};

type BacklogMilestone = {
  id: number;
  projectId: number;
  name: string;
  description: string;
  startDate: string | null;
  releaseDueDate: string | null;
  archived: boolean;
  displayOrder: number;
};

type BacklogSpaceDiskUsage = {
  capacity: number;
  issue: number;
  wiki: number;
  file: number;
  subversion: number;
  git: number;
  gitLFS: number;
  pullRequest: number;
  details: {
    projectId: number;
    issue: number;
    wiki: number;
    file: number;
    subversion: number;
    git: number;
    gitLFS: number;
    pullRequest: number;
  }[];
};

type BacklogSpaceNotification = {
  content: string;
  updated: string;
};

type BacklogWebhook = {
  id: number;
  name: string;
  description: string;
  hookUrl: string;
  allEvent: boolean;
  activityTypeIds: number[];
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

type BacklogStarCount = {
  count: number;
};

type BacklogWatching = {
  id: number;
  resourceAlreadyRead: boolean;
  note: string;
  type: string;
  issue?: BacklogIssue;
  lastContentUpdated: string | null;
  created: string;
  updated: string;
};

type BacklogWatchingCount = {
  count: number;
};

type BacklogDocument = {
  id: string;
  projectId: number;
  title: string;
  json: unknown;
  plain: string | null;
  statusId: number;
  emoji: string | null;
  createdUserId: number;
  created: string;
  updatedUserId: number;
  updated: string;
};

type BacklogDocumentDetail = {
  id: string;
  projectId: number;
  title: string;
  json: unknown;
  plain: string | null;
  statusId: number;
  emoji: string | null;
  attachments: {
    id: number;
    name: string;
    size: number;
    createdUser: BacklogUser;
    created: string;
  }[];
  tags: { id: number; name: string }[];
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

type BacklogDocumentTreeNode = {
  id: string;
  name: string;
  emoji: string | null;
  children: BacklogDocumentTreeNode[];
};

type BacklogDocumentTree = {
  projectId: number;
  activeTree: { id: string; children: BacklogDocumentTreeNode[] };
  trashTree: { id: string; children: BacklogDocumentTreeNode[] };
};

export type {
  BacklogActivity,
  BacklogCategory,
  BacklogChangeLog,
  BacklogComment,
  BacklogCommentNotification,
  BacklogDocument,
  BacklogDocumentDetail,
  BacklogDocumentTree,
  BacklogDocumentTreeNode,
  BacklogIssue,
  BacklogIssueType,
  BacklogMilestone,
  BacklogNotification,
  BacklogNotificationCount,
  BacklogPriority,
  BacklogProject,
  BacklogPullRequest,
  BacklogPullRequestComment,
  BacklogPullRequestStatus,
  BacklogRepository,
  BacklogResolution,
  BacklogSharedFile,
  BacklogSpace,
  BacklogSpaceDiskUsage,
  BacklogSpaceNotification,
  BacklogStar,
  BacklogStarCount,
  BacklogStatus,
  BacklogTeam,
  BacklogUser,
  BacklogWatching,
  BacklogWatchingCount,
  BacklogWebhook,
  BacklogWiki,
  BacklogWikiAttachment,
  BacklogWikiCount,
  BacklogWikiHistory,
  BacklogWikiTag,
};

export { DEFAULT_PRIORITY_ID, PR_STATUS, PRIORITY, RESOLUTION };
