import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "Backlog CLI",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/nulab/backlog-cli",
        },
        {
          icon: "npm",
          label: "npm",
          href: "https://www.npmjs.com/package/@nulab/backlog-cli",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          items: [{ label: "Getting Started", slug: "guides/getting-started" }],
        },
      ],
    }),
  ],
});
