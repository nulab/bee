/** Well-known Backlog pull request status IDs. */
const PrStatusId = {
  Open: 1,
  Closed: 2,
  Merged: 3,
} as const;

/** Pull request status name-to-ID map (lowercase keys for user input). */
const PrStatusName: Record<string, number> = {
  open: PrStatusId.Open,
  closed: PrStatusId.Closed,
  merged: PrStatusId.Merged,
};

const PR_STATUS_NAMES = Object.keys(PrStatusName);

export { PrStatusId, PrStatusName, PR_STATUS_NAMES };
