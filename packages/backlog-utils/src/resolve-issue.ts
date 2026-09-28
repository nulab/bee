import { vInteger } from "@repo/cli-utils";
import { type Backlog } from "backlog-js";
import * as v from "valibot";

export const resolveIssueId = async (client: Backlog, value: string): Promise<number> => {
  if (/^\d+$/.test(value)) {
    return v.parse(vInteger, value);
  }
  const issue = await client.getIssue(value);
  return issue.id;
};
