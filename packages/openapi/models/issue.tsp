namespace Backlog;

// ────────────────────────────────────────────
// Issue-related models
// ────────────────────────────────────────────

/** Backlog issue type. */
model IssueType {
  id: int64;
  projectId: int64;
  name: string;
  color: string;
  displayOrder: int32 | null;
}

/** Backlog priority. */
model Priority {
  id: int64;
  name: string;
}

/** Backlog issue status. */
model Status {
  id: int64;
  projectId: int64;
  name: string;
  color: string;
  displayOrder: int32;
}

/** Backlog resolution. */
model Resolution {
  id: int64;
  name: string;
}

/** Backlog category. */
model Category {
  id: int64;
  projectId: int64;
  name: string;
  displayOrder: int32 | null;
}

/** Backlog version/milestone. */
model Version {
  id: int64;
  projectId: int64;
  name: string;
  description: string | null;
  startDate: string | null;
  releaseDueDate: string | null;
  archived: boolean;
  displayOrder: int32 | null;
}

/** Backlog issue attachment. */
model Attachment {
  id: int64;
  name: string;
  size: int64;
  createdUser: User | null;
  created: utcDateTime;
}

/** Backlog shared file. */
model SharedFile {
  id: int64;
  projectId: int64;
  type: string;
  dir: string;
  name: string;
  size: int64 | null;
  createdUser: User | null;
  created: utcDateTime;
  updatedUser: User | null;
  updated: utcDateTime;
}

/** Backlog star. */
model Star {
  id: int64;
  comment: string | null;
  url: string;
  title: string;
  presenter: User | null;
  created: utcDateTime;
}

/** Backlog custom field value. */
model CustomFieldValue {
  id: int64;
  fieldTypeId: int32;
  name: string;
  value: unknown;
}

/** Backlog shared external file link on an issue. */
model IssueSharedExternalFileLink {
  id: int64;
  serviceType: string;
  name: string;
  url: string;
  createdUser: User | null;
  created: utcDateTime;
  updatedUser: User | null;
  updated: utcDateTime;
}

/** Summary of child issues. */
model ChildIssueSummary {
  closed: int32;
  total: int32;
}

// ────────────────────────────────────────────
// Issue
// ────────────────────────────────────────────

/** Backlog issue. */
model Issue {
  id: int64;
  projectId: int64;
  issueKey: string;
  keyId: int32;
  issueType: IssueType;
  summary: string;
  description: string;
  resolution: Resolution | null;
  priority: Priority;
  status: Status;
  assignee: User | null;
  category: Category[];
  version?: Version[];
  milestone: Version[];
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: float32 | null;
  actualHours: float32 | null;
  parentIssueId: int64 | null;
  createdUser: User | null;
  created: utcDateTime;
  updatedUser: User | null;
  updated: utcDateTime;
  customFieldValues?: CustomFieldValue[];
  attachments: Attachment[];
  sharedFiles: SharedFile[];
  sharedExternalFileLinks?: IssueSharedExternalFileLink[];
  stars: Star[];
  childIssueSummary?: ChildIssueSummary | null;
}

// ────────────────────────────────────────────
// Comment
// ────────────────────────────────────────────

/** Change log entry within a comment. */
model ChangeLog {
  field: string;
  newValue: string | null;
  originalValue: string | null;
  attachmentInfo: unknown;
  attributeInfo: unknown;
  notificationInfo: unknown;
}

/** Backlog issue comment. */
model Comment {
  id: int64;
  projectId: int64;
  issueId: int64;
  content: string | null;
  changeLog: ChangeLog[] | null;
  createdUser: User;
  created: utcDateTime;
  updated: utcDateTime;
  stars: Star[];
  notifications: unknown[];
}

// ────────────────────────────────────────────
// Issue count response
// ────────────────────────────────────────────

/** Response for issue count endpoint. */
model IssueCount {
  count: int32;
}
