export type BacklogUser = {
  id: number;
  userId: string;
  name: string;
  roleType: number;
  lang: string | null;
  mailAddress: string;
  lastLoginTime: string | null;
};

export type BacklogProject = {
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

export type BacklogStatus = {
  id: number;
  projectId: number;
  name: string;
  color: string;
  displayOrder: number;
};

export type BacklogIssueType = {
  id: number;
  projectId: number;
  name: string;
  color: string;
  displayOrder: number;
  templateSummary: string | null;
  templateDescription: string | null;
};

export type BacklogPriority = {
  id: number;
  name: string;
};

export type BacklogIssue = {
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

export type BacklogChangeLog = {
  field: string;
  newValue: string | null;
  originalValue: string | null;
  attachmentInfo: { id: number; name: string } | null;
  attributeInfo: { id: number; typeId: string } | null;
  notificationInfo: { type: string } | null;
};

export type BacklogCommentNotification = {
  id: number;
  alreadyRead: boolean;
  reason: number;
  user: BacklogUser;
  resourceAlreadyRead: boolean;
};

export type BacklogSharedFile = {
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

export type BacklogStar = {
  id: number;
  comment: string | null;
  url: string;
  title: string;
  presenter: BacklogUser;
  created: string;
};

export type BacklogComment = {
  id: number;
  content: string;
  changeLog: BacklogChangeLog[];
  createdUser: BacklogUser;
  created: string;
  updated: string;
  stars: BacklogStar[];
  notifications: BacklogCommentNotification[];
};

export type BacklogResolution = {
  id: number;
  name: string;
};

export type BacklogActivity = {
  id: number;
  project: BacklogProject;
  type: number;
  content: Record<string, unknown>;
  notifications: BacklogCommentNotification[];
  createdUser: BacklogUser;
  created: string;
};

export type BacklogSpace = {
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

export type BacklogRepository = {
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

export type BacklogPullRequestStatus = {
  id: number;
  name: string;
};

export type BacklogPullRequest = {
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

export const PRIORITY = {
  High: 2,
  Normal: 3,
  Low: 4,
} as const;

export const DEFAULT_PRIORITY_ID = PRIORITY.Normal;

export const RESOLUTION = {
  Fixed: 0,
  WontFix: 1,
  Invalid: 2,
  Duplicate: 3,
  CannotReproduce: 4,
} as const;

export const PR_STATUS = {
  Open: 1,
  Closed: 2,
  Merged: 3,
} as const;

export type BacklogPullRequestComment = {
  id: number;
  content: string;
  changeLog: BacklogChangeLog[];
  createdUser: BacklogUser;
  created: string;
  updated: string;
  stars: BacklogStar[];
  notifications: BacklogCommentNotification[];
};

export type BacklogNotification = {
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

export type BacklogNotificationCount = {
  count: number;
};

export type BacklogWikiAttachment = {
  id: number;
  name: string;
  size: number;
  createdUser: BacklogUser;
  created: string;
};

export type BacklogWiki = {
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

export type BacklogWikiTag = {
  id: number;
  name: string;
};

export type BacklogWikiHistory = {
  pageId: number;
  version: number;
  name: string;
  content: string;
  createdUser: BacklogUser;
  created: string;
};

export type BacklogWikiCount = {
  count: number;
};

export type BacklogTeam = {
  id: number;
  name: string;
  members: BacklogUser[];
  displayOrder: number | null;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
};

export type BacklogCategory = {
  id: number;
  name: string;
  displayOrder: number;
};

export type BacklogMilestone = {
  id: number;
  projectId: number;
  name: string;
  description: string;
  startDate: string | null;
  releaseDueDate: string | null;
  archived: boolean;
  displayOrder: number;
};

export type BacklogSpaceDiskUsage = {
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

export type BacklogSpaceNotification = {
  content: string;
  updated: string;
};

export type BacklogWebhook = {
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

export type BacklogStarCount = {
  count: number;
};

export type BacklogWatching = {
  id: number;
  resourceAlreadyRead: boolean;
  note: string;
  type: string;
  issue?: BacklogIssue;
  lastContentUpdated: string | null;
  created: string;
  updated: string;
};

export type BacklogWatchingCount = {
  count: number;
};

export type BacklogDocument = {
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

export type BacklogDocumentDetail = {
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

export type BacklogDocumentTreeNode = {
  id: string;
  name: string;
  emoji: string | null;
  children: BacklogDocumentTreeNode[];
};

export type BacklogDocumentTree = {
  projectId: number;
  activeTree: { id: string; children: BacklogDocumentTreeNode[] };
  trashTree: { id: string; children: BacklogDocumentTreeNode[] };
};
