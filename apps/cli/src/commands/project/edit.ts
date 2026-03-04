import { type BacklogProject } from "@repo/api";
import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "#/utils/client.js";

const edit = defineCommand({
  meta: {
    name: "edit",
    description: "Edit a project",
  },
  args: {
    "project-key": {
      type: "positional",
      description: "Project key",
      required: true,
    },
    name: {
      type: "string",
      alias: "n",
      description: "Project name",
    },
    key: {
      type: "string",
      alias: "k",
      description: "New project key",
    },
    "chart-enabled": {
      type: "boolean",
      description: "Enable chart",
    },
    archived: {
      type: "boolean",
      description: "Archive project",
    },
  },
  async run({ args }) {
    const { client } = await getClient();

    const body: Record<string, unknown> = {};

    if (args.name) {
      body.name = args.name;
    }
    if (args.key) {
      body.key = args.key;
    }
    if (args["chart-enabled"] != null) {
      body.chartEnabled = args["chart-enabled"];
    }
    if (args.archived != null) {
      body.archived = args.archived;
    }

    const project = await client<BacklogProject>(`/projects/${args["project-key"]}`, {
      method: "PATCH",
      body,
    });

    consola.success(`Updated project ${project.projectKey}: ${project.name}`);
  },
});

export { edit };
