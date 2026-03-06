/** Well-known Backlog issue status IDs. */
const IssueStatusId = {
  Open: 1,
  InProgress: 2,
  Resolved: 3,
  Closed: 4,
} as const;

/**
 * Backlog resolution name-to-ID map.
 *
 * Resolution values are fixed in Backlog and cannot be changed by users.
 * @see https://developer.nulab.com/ja/docs/backlog/api/2/get-resolution-list/
 */
const ResolutionId: Record<string, number> = {
  fixed: 0,
  "wont-fix": 1,
  invalid: 2,
  duplicate: 3,
  "cannot-reproduce": 4,
};

const RESOLUTION_NAMES = Object.keys(ResolutionId);

/**
 * Backlog priority name-to-ID map.
 *
 * Priority values are fixed in Backlog and cannot be changed by users.
 * @see https://developer.nulab.com/ja/docs/backlog/api/2/get-priority-list/
 */
const PriorityId: Record<string, number> = {
  high: 2,
  normal: 3,
  low: 4,
};

const PRIORITY_NAMES = Object.keys(PriorityId);

export { IssueStatusId, ResolutionId, RESOLUTION_NAMES, PriorityId, PRIORITY_NAMES };
