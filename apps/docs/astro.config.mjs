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
              label: "notification",
              items: [
                { label: "notification list", link: "/commands/notification/list" },
                { label: "notification count", link: "/commands/notification/count" },
                { label: "notification read", link: "/commands/notification/read" },
                { label: "notification read-all", link: "/commands/notification/read-all" },
              ],
            },
            {
              label: "pr",
              items: [
                { label: "pr list", link: "/commands/pr/list" },
                { label: "pr view", link: "/commands/pr/view" },
                { label: "pr comments", link: "/commands/pr/comments" },
                { label: "pr status", link: "/commands/pr/status" },
                { label: "pr create", link: "/commands/pr/create" },
                { label: "pr edit", link: "/commands/pr/edit" },
                { label: "pr comment", link: "/commands/pr/comment" },
              ],
            },
            {
              label: "repo",
              items: [
                { label: "repo list", link: "/commands/repo/list" },
                { label: "repo view", link: "/commands/repo/view" },
                { label: "repo clone", link: "/commands/repo/clone" },
              ],
            },
            {
              label: "user",
              items: [
                { label: "user list", link: "/commands/user/list" },
                { label: "user view", link: "/commands/user/view" },
                { label: "user me", link: "/commands/user/me" },
                { label: "user activities", link: "/commands/user/activities" },
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
            {
              label: "team",
              items: [
                { label: "team list", link: "/commands/team/list" },
                { label: "team view", link: "/commands/team/view" },
                { label: "team create", link: "/commands/team/create" },
                { label: "team edit", link: "/commands/team/edit" },
                { label: "team delete", link: "/commands/team/delete" },
              ],
            },
            {
              label: "wiki",
              items: [
                { label: "wiki list", link: "/commands/wiki/list" },
                { label: "wiki view", link: "/commands/wiki/view" },
                { label: "wiki count", link: "/commands/wiki/count" },
                { label: "wiki tags", link: "/commands/wiki/tags" },
                { label: "wiki history", link: "/commands/wiki/history" },
                { label: "wiki attachments", link: "/commands/wiki/attachments" },
                { label: "wiki create", link: "/commands/wiki/create" },
                { label: "wiki edit", link: "/commands/wiki/edit" },
                { label: "wiki delete", link: "/commands/wiki/delete" },
              ],
            },
          ],
        },
      ],
    }),
  ],
});
