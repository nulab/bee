import { type Backlog } from "backlog-js";

export const resolveProjectIds = async (client: Backlog, values: string[]): Promise<number[]> => {
  if (values.length === 0) {
    return [];
  }

  const projects = await client.getProjects();

  return values.map((value) => {
    const asNumber = Number(value);

    if (!Number.isNaN(asNumber)) {
      const byId = projects.find((p) => p.id === asNumber);
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
