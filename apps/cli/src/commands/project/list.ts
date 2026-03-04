import { type BacklogProject } from "@repo/api";
import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "#/utils/client.js";
import { formatProjectLine, padEnd } from "#/utils/format.js";
import { outputArgs, outputResult } from "#/utils/output.js";

const list = defineCommand({
  meta: {
    name: "list",
    description: "List projects",
  },
  args: {
    ...outputArgs,
    archived: {
      type: "boolean",
      description: "Include archived projects",
    },
    all: {
      type: "boolean",
      description: "Show all projects (admin only)",
    },
    limit: {
      type: "string",
      alias: "L",
      description: "Number of results",
      default: "20",
    },
  },
  async run({ args }) {
    const { client } = await getClient();
    const limit = Number.parseInt(args.limit, 10);

    const query: Record<string, unknown> = {};
    if (args.archived != null) {
      query.archived = args.archived;
    }
    if (args.all) {
      query.all = true;
    }

    const projects = await client<BacklogProject[]>("/projects", { query });

    const displayed = projects.slice(0, limit);

    outputResult(displayed, args, (data) => {
      if (data.length === 0) {
        consola.info("No projects found.");
        return;
      }

      const header = `${padEnd("KEY", 16)}${padEnd("NAME", 30)}STATUS`;
      consola.log(header);
      for (const p of data) {
        consola.log(formatProjectLine(p));
      }
    });
  },
});

export { list };
