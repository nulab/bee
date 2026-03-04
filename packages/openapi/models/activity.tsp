namespace Backlog;

// ────────────────────────────────────────────
// Activity content sub-models
// ────────────────────────────────────────────

/** Comment within activity content. */
model ActivityContentComment {
  id?: int64;
  content?: string;
}

/** Change record within activity content. */
model ActivityContentChange {
  field?: string;
  field_text?: string;
  new_value?: string;
  old_value?: string;
  type?: string;
}

/** Attachment within activity content. */
model ActivityContentAttachment {
  id?: int64;
  name?: string;
  size?: int64;
}

/** Shared file within activity content. */
model ActivityContentSharedFile {
  id?: int64;
  dir?: string;
  name?: string;
  size?: int64;
}

/** External file link within activity content. */
model ActivityContentExternalFileLink {
  name?: string;
  url?: string;
}

/** Git repository within activity content. */
model ActivityContentGitRepository {
  id?: int64;
  name?: string;
  description?: string;
}

/** Git revision within activity content. */
model ActivityContentGitRevision {
  rev?: string;
  comment?: string;
}

/** Link within activity content (multi-update). */
model ActivityContentLink {
  id?: int64;
  key_id?: int64;
  title?: string;
  comment?: ActivityContentComment;
}

/** Change record for multi-update activities. */
model ActivityContentMultiUpdateChange {
  field?: string;
  new_value?: string;
  type?: string;
}

/** Issue snapshot within activity content. */
model ActivityContentIssueSnapshot {
  id?: int64;
  key_id?: int64;
  issue_key?: string;
  summary?: string;
  description?: string;
}

/** Deleted status within activity content. */
model ActivityContentDeletedStatus {
  name?: string;
}

/** Team within activity content. */
model ActivityContentTeam {
  id?: int64;
  name?: string;
}

// ────────────────────────────────────────────
// Activity content
// ────────────────────────────────────────────

/** Activity content details. */
model ActivityContent {
  // Common
  id?: int64;
  key_id?: int64;
  summary?: string;
  description?: string;
  comment?: ActivityContentComment;
  changes?: ActivityContentChange[];

  // Issue (2,3,17)
  attachments?: ActivityContentAttachment[];
  shared_files?: ActivityContentSharedFile[];
  external_file_links?: ActivityContentExternalFileLink[];

  // Wiki (5,6,7)
  name?: string;
  content?: string;
  diff?: string;
  version?: int32;

  // File (8,9,10)
  dir?: string;
  size?: int64;

  // SVN (11)
  rev?: string;

  // Git (12)
  repository?: ActivityContentGitRepository;
  change_type?: string;
  revision_type?: string;
  ref?: string;
  revision_count?: int32;
  revisions?: ActivityContentGitRevision[];

  // Issue Multi-Update (14,35)
  tx_id?: int64;
  link?: ActivityContentLink[];

  // Project Member (15,16)
  users?: User[];
  group_project_activities?: unknown[];

  // Pull Request (18-21)
  number?: int64;
  issue?: ActivityContentIssueSnapshot;

  // Version/Milestone (22-24)
  start_date?: string;
  reference_date?: string;

  // Project Team (25,26)
  parties?: ActivityContentTeam[];

  // Status Deleted (34)
  deletedStatus?: ActivityContentDeletedStatus;
}

// ────────────────────────────────────────────
// Activity
// ────────────────────────────────────────────

/** Backlog activity/recent update. */
model Activity {
  id: int64;

  type: int32;

  project: Project;
  content: ActivityContent;
  notifications: unknown[];
  createdUser: User | null;
  created: utcDateTime;
}
