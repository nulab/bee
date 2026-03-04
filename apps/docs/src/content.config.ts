import { defineCollection } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";
import { commandEntrySchema, commandsLoader } from "./lib/commands-loader";

export const collections = {
  docs: defineCollection({ schema: docsSchema() }),
  commands: defineCollection({
    loader: commandsLoader(),
    schema: commandEntrySchema,
  }),
};
