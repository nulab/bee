import { type BacklogProject } from "@repo/api";
import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "#/utils/client.js";
import { confirmOrExit } from "#/utils/prompt.js";

const deleteProject = defineCommand({
  meta: {
    name: "delete",
    description: "Delete a project",
  },
  args: {
    "project-key": {
      type: "positional",
      description: "Project key",
      required: true,
    },
    yes: {
      type: "boolean",
      alias: "y",
      description: "Skip confirmation prompt",
    },
  },
  async run({ args }) {
    const { client } = await getClient();

    const proceed = await confirmOrExit(
      `Are you sure you want to delete project ${args["project-key"]}? This cannot be undone.`,
      args.yes,
    );
    if (!proceed) {
      return;
    }

    const project = await client<BacklogProject>(`/projects/${args["project-key"]}`, {
      method: "DELETE",
    });

    consola.success(`Deleted project ${project.projectKey}: ${project.name}`);
  },
});

export { deleteProject };
