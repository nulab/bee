import { type BacklogClient, getClient } from "@repo/backlog-utils";
import { UserError, outputResult, vFiniteNumber } from "@repo/cli-utils";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../lib/bee-command";
import * as opt from "../lib/common-options";
import { collect } from "../lib/common-options";

type ParamValue = string | number | boolean;
type Params = Record<string, ParamValue | ParamValue[]>;

const api = new BeeCommand("api")
  .summary("Make an authenticated API request")
  .description(
    `The endpoint is a Backlog API path (e.g. \`users/myself\`). A leading \`/api/v2/\` prefix is stripped automatically.

\`-f\` infers types (number, boolean, string); \`-F\` always sends strings. Repeated keys become arrays. Append \`[]\` for a single-element array (e.g. \`-f projectId[]=12345\`).

For GET, fields are query parameters. For POST/PUT/PATCH/DELETE, fields are the request body.`,
  )
  .argument("<endpoint>", "API endpoint path")
  .option("-X, --method <method>", "HTTP method", "GET")
  .option(
    "-f, --field <key=value>",
    "Add a parameter with type inference (key=value, repeatable)",
    collect,
    [],
  )
  .option(
    "-F, --raw-field <key=value>",
    "Add a string parameter (key=value, repeatable)",
    collect,
    [],
  )
  .option("--json [fields]", "Output as JSON (optionally filter by field names, comma-separated)")
  .option("--silent", "Do not print the response body")
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Get your user profile", command: "bee api users/myself" },
    {
      description: "List issues in a project",
      command: "bee api issues -f 'projectId[]=12345' -f count=5",
    },
    {
      description: "Filter by multiple statuses",
      command: "bee api issues -f 'projectId[]=12345' -f statusId=1 -f statusId=2",
    },
    {
      description: "Create an issue",
      command:
        'bee api issues -X POST -f projectId=12345 -f summary="Test issue" -f issueTypeId=1 -f priorityId=3',
    },
    {
      description: "Select specific fields",
      command: "bee api users/myself --json id,name,mailAddress",
    },
  ])
  .action(async (endpoint: string, opts) => {
    const { client } = await getClient(opts.space);

    const method = opts.method.toUpperCase();
    const normalizedEndpoint = normalizeEndpoint(endpoint);

    const params = buildParams(opts.field, opts.rawField);

    const data = await makeRequest(client, method, normalizedEndpoint, params);

    if (opts.silent) {
      return;
    }

    // Default to JSON output (api always returns JSON).
    // --json with field names filters the output via outputResult.
    const jsonVal = typeof opts.json === "string" ? opts.json : "";
    outputResult(data, { json: jsonVal }, () => {});
  });

/**
 * Normalize API endpoint path for backlog-js client methods.
 * backlog-js prepends `restBaseURL` (which includes `/api/v2`), so
 * the path passed to `client.get()` etc. must be relative (e.g. `users/myself`).
 * This function strips a leading `/api/v2/` prefix if the user supplied one.
 */
const normalizeEndpoint = (endpoint: string): string => {
  const stripped = endpoint.replace(/^\/?(api\/v2\/?)/, "");
  return stripped;
};

/**
 * Build params object from --field and --raw-field values.
 * --field infers types (number, boolean, string).
 * --raw-field always uses strings.
 * When the same key appears multiple times, values are collected into an array.
 */
const buildParams = (fields: string[], rawFields: string[]): Params => {
  const params: Params = {};

  const addParam = (rawKey: string, value: ParamValue) => {
    // Strip trailing `[]` — backlog-js adds brackets automatically for arrays
    // via qs.stringify({ arrayFormat: 'brackets' }).
    const isArray = rawKey.endsWith("[]");
    const key = isArray ? rawKey.slice(0, -2) : rawKey;

    const existing = params[key];
    if (existing === undefined) {
      params[key] = isArray ? [value] : value;
    } else {
      params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    }
  };

  for (const pair of fields) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) {
      throw new UserError(`Invalid field format: "${pair}". Expected key=value.`);
    }
    addParam(pair.slice(0, eqIndex), inferType(pair.slice(eqIndex + 1)));
  }

  for (const pair of rawFields) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) {
      throw new UserError(`Invalid field format: "${pair}". Expected key=value.`);
    }
    addParam(pair.slice(0, eqIndex), pair.slice(eqIndex + 1));
  }

  return params;
};

/**
 * Infer type from a string value.
 */
const inferType = (value: string): ParamValue => {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value !== "") {
    const result = v.safeParse(vFiniteNumber, value);
    if (result.success) {
      return result.output;
    }
  }
  return value;
};

const makeRequest = async (
  client: BacklogClient,
  method: string,
  endpoint: string,
  params: Params,
): Promise<unknown> => {
  switch (method) {
    case "GET": {
      return client.get(endpoint, params);
    }
    case "POST": {
      return client.post(endpoint, params);
    }
    case "PUT": {
      return client.put(endpoint, params);
    }
    case "PATCH": {
      return client.patch(endpoint, params);
    }
    case "DELETE": {
      return client.delete(endpoint, params);
    }
    default: {
      throw new UserError(`Unsupported HTTP method: ${method}`);
    }
  }
};

export default api;
