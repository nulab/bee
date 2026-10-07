import { readFile } from "node:fs/promises";
import { text } from "node:stream/consumers";
import { pipeline } from "node:stream/promises";
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

\`-f\` infers types (number, boolean, string); \`-F\` always sends strings. A value is only inferred as a number when the number prints back identically, so \`1.0\`, \`0042\` and \`0x10\` stay strings. Repeated keys become arrays. Append \`[]\` for a single-element array (e.g. \`-f projectId[]=12345\`).

If a \`-f\` value starts with \`@\`, the rest of the value is interpreted as a filename to read the value from. Pass \`-\` to read from standard input (e.g. \`-f 'key=@-'\`). File and stdin content is always sent as a string, without type inference.

For GET, fields are query parameters. For POST/PUT/PATCH/DELETE, fields are the request body.

JSON responses are formatted as JSON. Other response bodies are written unchanged to standard output. Redirect the output to a file to download attachments. \`--json\` is only supported for JSON responses.`,
  )
  .argument("<endpoint>", "API endpoint path")
  .option("-X, --method <method>", "HTTP method", "GET")
  .option(
    "-f, --field <key=value>",
    'Add a typed parameter (use "@<path>" or "@-" to read value from file or stdin)',
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
      description: "Set a field value from a file",
      command: "bee api issues/PROJECT-1 -X PATCH -f 'description=@desc.md'",
    },
    {
      description: "Pipe content from stdin",
      command: "echo 'Hello' | bee api issues/PROJECT-1/comments -X POST -f 'content=@-'",
    },
    {
      description: "Select specific fields",
      command: "bee api users/myself --json id,name,mailAddress",
    },
    {
      description: "Download an issue attachment",
      command: "bee api issues/PROJECT-1/attachments/123 > image.png",
    },
  ])
  .action(async (endpoint: string, opts) => {
    const { client } = await getClient(opts.space);

    const method = opts.method.toUpperCase();
    const normalizedEndpoint = normalizeEndpoint(endpoint);

    const params = await buildParams(opts.field, opts.rawField);

    const response = await makeRequest(client, method, normalizedEndpoint, params);

    if (opts.silent) {
      await response.body?.cancel();
      return;
    }

    if (!response.body || response.headers.get("Content-Length") === "0") {
      return;
    }

    const contentType = response.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase();
    const isJson = contentType === "application/json" || contentType?.endsWith("+json");

    if (isJson) {
      const data: unknown = await response.json();
      const jsonVal = typeof opts.json === "string" ? opts.json : "";
      outputResult(data, { json: jsonVal }, () => {});
      return;
    }

    if (opts.json !== undefined) {
      await response.body.cancel();
      throw new UserError("--json is only supported for JSON responses.");
    }

    await pipeline(response.body, process.stdout, { end: false });
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
 * Read a field value from a file (`@path`) or stdin (`@-`) reference.
 * The content is sent as-is: no trimming, and no type inference — gh's
 * magicFieldValue does the same. Inferring here would coerce content that
 * only looks numeric: a file holding just a newline became `0`, because
 * Number("\n") is 0.
 */
const readFieldValue = async (ref: string): Promise<string> => {
  if (ref === "-") {
    return text(process.stdin);
  }

  if (ref === "") {
    throw new UserError(
      'Invalid file reference: "@". Provide a file path after @ or use @- for stdin.',
    );
  }

  try {
    return await readFile(ref, "utf8");
  } catch (error) {
    const { code } = error as NodeJS.ErrnoException;
    if (code === "ENOENT") {
      throw new UserError(`File not found: ${ref}`);
    }
    if (code === "EISDIR") {
      throw new UserError(`Expected a file but got a directory: ${ref}`);
    }
    throw error;
  }
};

/**
 * Build params object from --field and --raw-field values.
 * --field infers types (number, boolean, string) and supports @file references.
 * --raw-field always uses literal strings.
 * When the same key appears multiple times, values are collected into an array.
 */
const buildParams = async (fields: string[], rawFields: string[]): Promise<Params> => {
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
    const rawValue = pair.slice(eqIndex + 1);
    const value = rawValue.startsWith("@")
      ? await readFieldValue(rawValue.slice(1))
      : inferType(rawValue);
    addParam(pair.slice(0, eqIndex), value);
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
 *
 * A value is only treated as a number when it survives the round trip through
 * one — `String(Number(value)) === value`. Everything `Number()` accepts is a
 * wider set than the spellings it can reproduce, and the difference is sent
 * over the wire: `1.0` became `1`, `0042` became `42`, `0x10` became `16`, and
 * an id past 2^53 lost digits, all without an error. Since the API takes
 * form-encoded params, an inferred number is stringified again anyway, so
 * declining to infer here costs nothing and keeps the value intact.
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
    if (result.success && String(result.output) === value) {
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
): Promise<Response> => {
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    throw new UserError(`Unsupported HTTP method: ${method}`);
  }

  const requestParams: Record<string, string | number | string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      requestParams[key] = value.map(String);
    } else if (typeof value === "boolean") {
      requestParams[key] = String(value);
    } else {
      requestParams[key] = value;
    }
  }

  return client.request({ method, path: endpoint, params: requestParams });
};

export default api;
