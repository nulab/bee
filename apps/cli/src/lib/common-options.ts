import { parseArg, vInteger } from "@repo/cli-utils";
import { Option } from "commander";
import { RequiredOption } from "./required-option";

const collect = (val: string, prev: string[]): string[] => [...prev, val];
const collectNum = (val: string, prev: number[]): number[] => [
  ...prev,
  parseArg(vInteger, val, "value"),
];

const project = () =>
  new RequiredOption("-p, --project <id>", "Project ID or project key").env("BACKLOG_PROJECT");
const repo = () =>
  new RequiredOption("-R, --repo <name>", "Repository name or ID").env("BACKLOG_REPO");
const count = () => new Option("-L, --count <n>", "Number of results (default: 20)");
const offset = () => new Option("--offset <n>", "Offset for pagination");
const order = () => new Option("--order <dir>", "Sort order").choices(["asc", "desc"]);
const minId = () => new Option("--min-id <n>", "Minimum ID for cursor-based pagination");
const maxId = () => new Option("--max-id <n>", "Maximum ID for cursor-based pagination");
const keyword = () => new Option("-k, --keyword <text>", "Keyword search");
const assignee = () => new Option("-a, --assignee <id>", "Assignee user ID. Use @me for yourself.");
const assigneeList = () =>
  new Option("-a, --assignee <id>", "Assignee user ID (repeatable). Use @me for yourself.")
    .argParser(collect)
    .default([]);
const issue = () => new Option("--issue <key>", "Issue ID or issue key");
const notify = () =>
  new Option("--notify <id>", "User IDs to notify (repeatable)").argParser(collectNum).default([]);
const attachment = () =>
  new Option("--attachment <id>", "Attachment IDs (repeatable)").argParser(collectNum).default([]);
const category = () =>
  new Option("--category <id>", "Category IDs (repeatable)").argParser(collectNum).default([]);
const version = () =>
  new Option("--version <id>", "Version IDs (repeatable)").argParser(collectNum).default([]);
const milestone = () =>
  new Option("--milestone <id>", "Milestone IDs (repeatable)").argParser(collectNum).default([]);
const comment = () => new Option("-c, --comment <text>", "Comment to add with the update");
const web = (resource: string) => new Option("-w, --web", `Open the ${resource} in the browser`);
const noBrowser = () =>
  new Option("-n, --no-browser", "Print the URL instead of opening the browser");
const space = () => new Option("-s, --space <hostname>", "Space hostname").env("BACKLOG_SPACE");
const json = () =>
  new Option(
    "--json [fields]",
    "Output as JSON (optionally filter by field names, comma-separated)",
  ).preset("");

export {
  collect,
  collectNum,
  space,
  project,
  repo,
  count,
  offset,
  order,
  minId,
  maxId,
  keyword,
  assignee,
  assigneeList,
  issue,
  notify,
  attachment,
  category,
  version,
  milestone,
  comment,
  web,
  noBrowser,
  json,
};
