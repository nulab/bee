import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://nulab.github.io",
  integrations: [
    starlight({
      title: "bee",
      defaultLocale: "ja",
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
              label: "issue",
              items: [
                { label: "issue list", link: "/commands/issue/list" },
                { label: "issue view", link: "/commands/issue/view" },
                { label: "issue status", link: "/commands/issue/status" },
                { label: "issue create", link: "/commands/issue/create" },
                { label: "issue edit", link: "/commands/issue/edit" },
                { label: "issue close", link: "/commands/issue/close" },
                { label: "issue reopen", link: "/commands/issue/reopen" },
                { label: "issue comment", link: "/commands/issue/comment" },
                { label: "issue delete", link: "/commands/issue/delete" },
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
            {
              label: "document",
              items: [
                { label: "document list", link: "/commands/document/list" },
                { label: "document view", link: "/commands/document/view" },
                { label: "document tree", link: "/commands/document/tree" },
                { label: "document attachments", link: "/commands/document/attachments" },
                { label: "document create", link: "/commands/document/create" },
                { label: "document delete", link: "/commands/document/delete" },
              ],
            },
          ],
        },
      ],
    }),
  ],
});
