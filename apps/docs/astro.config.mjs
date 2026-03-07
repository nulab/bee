import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { loadCommandSidebar } from "./src/lib/sidebar-commands";

const commandSidebar = await loadCommandSidebar();

export default defineConfig({
  site: "https://nulab.github.io",
  integrations: [
    starlight({
      title: "Backlog CLI",
      logo: {
        src: "./src/assets/title.svg",
        alt: "Backlog CLI",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      customCss: ["./src/theme.css"],
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
        {
          icon: "open-book",
          label: "Backlog API",
          href: "https://developer.nulab.com/ja/docs/backlog/",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [{ label: "はじめに", slug: "guides/getting-started" }],
        },
        {
          label: "Guides",
          items: [
            { label: "認証", slug: "guides/authentication" },
            { label: "出力とフォーマット", slug: "guides/output-formatting" },
            { label: "シェル補完", slug: "guides/shell-completion" },
            { label: "環境変数", slug: "guides/environment-variables" },
          ],
        },
        {
          label: "Integrations",
          items: [
            { label: "CI/CD での利用", slug: "guides/ci-cd" },
            { label: "AI エージェントとの連携", slug: "guides/ai-agent" },
          ],
        },
        ...commandSidebar,
      ],
    }),
  ],
});
