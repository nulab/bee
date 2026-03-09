import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import { defListHastHandlers, remarkDefinitionList } from "remark-definition-list";
import { loadCommandSidebar } from "./src/lib/sidebar-commands";

const commandSidebar = await loadCommandSidebar();

export default defineConfig({
  site: "https://nulab.github.io",
  base: "/bee",
  markdown: {
    remarkPlugins: [remarkDefinitionList],
    remarkRehype: { handlers: { ...defListHastHandlers } },
  },
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          exclude: ["/bee/commands/**"],
        }),
      ],
      title: "Backlog CLI",
      logo: {
        src: "./src/assets/title.svg",
        alt: "Backlog CLI",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      customCss: ["./src/theme.css"],
      defaultLocale: "root",
      locales: {
        root: { label: "日本語", lang: "ja" },
      },
      head: [
        {
          tag: "meta",
          attrs: { property: "og:image", content: "https://nulab.github.io/bee/og-image.png" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:card", content: "summary" },
        },
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "text/markdown",
            href: "/bee/llms.txt",
            title: "LLM-friendly summary",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "text/markdown",
            href: "/bee/llms-full.txt",
            title: "Full LLM command reference",
          },
        },
      ],
      components: {
        Head: "./src/components/Head.astro",
        Footer: "./src/components/Footer.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/nulab/bee",
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
          items: [{ label: "はじめに", slug: "getting-started" }],
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
            { label: "CI/CD での利用", slug: "integrations/ci-cd" },
            { label: "AI エージェントとの連携", slug: "integrations/ai-agent" },
          ],
        },
        {
          label: "Recipes",
          items: [
            {
              label: "Pull Request と課題を連動させる",
              slug: "recipes/pr-lifecycle-sync",
            },
            {
              label: "リリース時に関連課題へ通知",
              slug: "recipes/release-notify-issues",
            },
            {
              label: "AI エージェント向けプロンプト集",
              slug: "recipes/useful-prompts",
            },
          ],
        },
        { label: "Commands", link: "/commands/" },
        ...commandSidebar,
      ],
    }),
  ],
});
