import { type RcAuth, type RcSpace } from "./schema";

import { updateConfig } from "./config";

const addSpace = (space: RcSpace): void => {
  updateConfig((config) => {
    if (config.spaces.some((s) => s.host === space.host)) {
      throw new Error(`Space with host "${space.host}" already exists in configuration.`);
    }
    return { ...config, spaces: [...config.spaces, space] };
  });
};

const removeSpace = (host: string): void => {
  updateConfig((config) => {
    if (!config.spaces.some((space) => space.host === host)) {
      throw new Error(`Space with host "${host}" not found in configuration.`);
    }
    const spaces = config.spaces.filter((space) => space.host !== host);
    const defaultSpace = config.defaultSpace === host ? undefined : config.defaultSpace;
    return { ...config, spaces, defaultSpace };
  });
};

const updateSpaceAuth = (host: string, auth: RcAuth): void => {
  updateConfig((config) => {
    const index = config.spaces.findIndex((space) => space.host === host);
    if (index === -1) {
      throw new Error(`Space with host "${host}" not found in configuration.`);
    }
    return {
      ...config,
      spaces: config.spaces.with(index, { ...config.spaces[index], auth }),
    };
  });
};

const findSpace = (spaces: readonly RcSpace[], host: string): RcSpace | null => {
  const exactMatch = spaces.find((s) => s.host === host);
  if (exactMatch) {
    return exactMatch;
  }

  const prefixMatches = spaces.filter((s) => s.host.startsWith(`${host}.`));

  const [singleMatch] = prefixMatches;
  if (prefixMatches.length === 1) {
    return singleMatch;
  }

  if (prefixMatches.length > 1) {
    const candidates = prefixMatches.map((s) => s.host).join(", ");
    throw new Error(`Ambiguous space name "${host}". Matching spaces: ${candidates}`);
  }

  return null;
};

export { addSpace, findSpace, removeSpace, updateSpaceAuth };
