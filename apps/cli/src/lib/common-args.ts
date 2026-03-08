/**
 * Shared argument definitions for CLI commands.
 *
 * Import as a namespace and spread into `args` to ensure consistent
 * descriptions, aliases, and valueHints across commands.  Override
 * individual properties when needed (e.g. `{ ...commonArgs.project, required: true }`).
 *
 * @example
 * ```ts
 * import * as commonArgs from "../../lib/common-args";
 *
 * args: {
 *   ...outputArgs,
 *   project: commonArgs.project,
 *   count: commonArgs.count,
 *   order: commonArgs.order,
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Project / Repository
// ---------------------------------------------------------------------------

const project = {
  type: "string" as const,
  alias: "p",
  description: "Project ID or project key",
  default: process.env.BACKLOG_PROJECT,
};

const projectPositional = {
  type: "positional",
  description: "Project ID or project key",
  required: true,
  default: process.env.BACKLOG_PROJECT,
} as const;

const repo = {
  type: "string",
  alias: "R",
  description: "Repository name or ID",
  default: process.env.BACKLOG_REPO,
  required: true,
} as const;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

const count = {
  type: "string" as const,
  alias: "L",
  description: "Number of results (default: 20)",
  valueHint: "<1-100>",
};

const offset = {
  type: "string" as const,
  description: "Offset for pagination",
  valueHint: "<number>",
};

const order = {
  type: "string" as const,
  description: "Sort order",
  valueHint: "{asc|desc}",
};

const minId = {
  type: "string" as const,
  description: "Minimum ID for cursor-based pagination",
  valueHint: "<number>",
};

const maxId = {
  type: "string" as const,
  description: "Maximum ID for cursor-based pagination",
  valueHint: "<number>",
};

// ---------------------------------------------------------------------------
// Common filters
// ---------------------------------------------------------------------------

const keyword = {
  type: "string" as const,
  alias: "k",
  description: "Keyword search",
};

const assignee = {
  type: "string" as const,
  alias: "a",
  description: "Assignee user ID. Use @me for yourself.",
};

const assigneeList = {
  type: "string" as const,
  alias: "a",
  description: "Assignee user ID (comma-separated for multiple). Use @me for yourself.",
};

// ---------------------------------------------------------------------------
// Issue
// ---------------------------------------------------------------------------

const issue = {
  type: "string" as const,
  description: "Issue ID or issue key",
  valueHint: "<PROJECT-123>",
};

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

const notify = {
  type: "string" as const,
  description: "User IDs to notify (comma-separated for multiple)",
};

const attachment = {
  type: "string" as const,
  description: "Attachment IDs (comma-separated for multiple)",
};

const comment = {
  type: "string" as const,
  alias: "c",
  description: "Comment to add with the update",
};

// ---------------------------------------------------------------------------
// --web flag (factory — description varies by resource)
// ---------------------------------------------------------------------------

const web = (resource: string) => ({
  type: "boolean" as const,
  alias: "w",
  description: `Open the ${resource} in the browser`,
});

// ---------------------------------------------------------------------------
// --no-browser flag (print URL instead of opening browser)
// ---------------------------------------------------------------------------

const noBrowser = {
  type: "boolean" as const,
  alias: "n",
  description: "Print the URL instead of opening the browser",
};

export {
  project,
  projectPositional,
  repo,
  issue,
  count,
  offset,
  order,
  minId,
  maxId,
  keyword,
  assignee,
  assigneeList,
  notify,
  attachment,
  comment,
  web,
  noBrowser,
};
