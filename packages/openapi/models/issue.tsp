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
  displayOrder: int32;
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
  name: string;
  displayOrder: int32;
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
  displayOrder: int32;
}

/** Backlog issue attachment. */
model Attachment {
  id: int64;
  name: string;
  size: int64;
}

/** Backlog shared file. */
model SharedFile {
  id: int64;
  projectId: int64;
  type: string;
  dir: string;
  name: string;
  size: int64;
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

// ────────────────────────────────────────────
// Issue
// ────────────────────────────────────────────

/** Backlog issue. */
model Issue {
  id: int64;
  projectId: int64;
  issueKey: string;
  keyId: int64;
  issueType: IssueType;
  summary: string;
  description: string | null;
  resolution: Resolution | null;
  priority: Priority;
  status: Status;
  assignee: User | null;
  category: Category[];
  versions: Version[];
  milestone: Version[];
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: float64 | null;
  actualHours: float64 | null;
  parentIssueId: int64 | null;
  createdUser: User;
  created: utcDateTime;
  updatedUser: User | null;
  updated: utcDateTime;
  customFields: CustomFieldValue[];
  attachments: Attachment[];
  sharedFiles: SharedFile[];
  stars: Star[];
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
