import { vInteger } from "@repo/cli-utils";
import { type Client, getProjects } from "backlog-js";
import * as v from "valibot";

export const resolveProjectIds = async (client: Client, values: string[]): Promise<number[]> => {
  if (values.length === 0) {
    return [];
  }

  const projects = await getProjects(client);

  return values.map((value) => {
    const numResult = v.safeParse(vInteger, value);

    if (numResult.success) {
      const byId = projects.find((p) => p.id === numResult.output);
      if (byId) {
        return byId.id;
      }
    }

    const byKey = projects.find((p) => p.projectKey === value);
    if (byKey) {
      return byKey.id;
    }

    throw new Error(`Project not found: "${value}"`);
  });
};
