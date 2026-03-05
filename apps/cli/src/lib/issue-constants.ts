/** Well-known Backlog issue status IDs. */
export const IssueStatusId = {
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
export const ResolutionId: Record<string, number> = {
  fixed: 0,
  "wont-fix": 1,
  invalid: 2,
  duplicate: 3,
  "cannot-reproduce": 4,
};

export const RESOLUTION_NAMES = Object.keys(ResolutionId);
