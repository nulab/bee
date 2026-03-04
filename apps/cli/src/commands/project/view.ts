import { type BacklogProject } from "@repo/api";
import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "#/utils/client.js";
import { outputArgs, outputResult } from "#/utils/output.js";
import { openUrl, projectUrl } from "#/utils/url.js";

const view = defineCommand({
  meta: {
    name: "view",
    description: "View project details",
  },
  args: {
    ...outputArgs,
    projectKey: {
      type: "positional",
      description: "Project key",
      required: true,
    },
    web: {
      type: "boolean",
      description: "Open in browser",
    },
  },
  async run({ args }) {
    const { client, host } = await getClient();

    const p = await client<BacklogProject>(`/projects/${args.projectKey}`);

    if (args.web) {
      const url = projectUrl(host, p.projectKey);
      consola.info(`Opening ${url}`);
      await openUrl(url);
      return;
    }

    outputResult(p, args, (data) => {
      consola.log("");
      consola.log(`  ${data.name} (${data.projectKey})`);
      consola.log("");
      consola.log(`    Status:              ${data.archived ? "Archived" : "Active"}`);
      consola.log(`    Text Formatting:     ${data.textFormattingRule}`);
      consola.log(`    Chart Enabled:       ${data.chartEnabled ? "Yes" : "No"}`);
      consola.log(`    Subtasking Enabled:  ${data.subtaskingEnabled ? "Yes" : "No"}`);
      consola.log(`    Wiki:                ${data.useWiki ? "Yes" : "No"}`);
      consola.log(`    File Sharing:        ${data.useFileSharing ? "Yes" : "No"}`);
      consola.log(`    Dev Attributes:      ${data.useDevAttributes ? "Yes" : "No"}`);
      consola.log("");
    });
  },
});

export { view };
