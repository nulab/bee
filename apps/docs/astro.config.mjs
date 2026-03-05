import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";

export default defineConfig({
  site: "https://nulab.github.io",
  integrations: [
    starlight({
      title: "bee",
      defaultLocale: "ja",
      plugins: [
        starlightOpenAPI([
          {
            base: "api",
            schema: "../../packages/openapi/tsp-output/@typespec/openapi3/openapi.yaml",
          },
        ]),
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/nulab/backlog-cli",
        },
        {
          icon: "npm",
          label: "npm",
          href: "https://www.npmjs.com/package/@nulab/bee",
        },
      ],
      sidebar: [
        {
          label: "ガイド",
          items: [{ label: "はじめに", slug: "guides/getting-started" }],
        },
        {
          label: "コマンド",
          items: [
            {
              label: "auth",
              items: [
                { label: "auth login", link: "/commands/auth/login" },
                { label: "auth logout", link: "/commands/auth/logout" },
                { label: "auth refresh", link: "/commands/auth/refresh" },
                { label: "auth status", link: "/commands/auth/status" },
                { label: "auth switch", link: "/commands/auth/switch" },
                { label: "auth token", link: "/commands/auth/token" },
              ],
            },
            {
              label: "project",
              items: [
                { label: "project list", link: "/commands/project/list" },
                { label: "project view", link: "/commands/project/view" },
                { label: "project users", link: "/commands/project/users" },
                { label: "project activities", link: "/commands/project/activities" },
              ],
            },
          ],
        },
        ...openAPISidebarGroups,
      ],
    }),
  ],
});
