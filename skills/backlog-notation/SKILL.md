---
name: backlog-notation
description: Syntax reference for Backlog notation (Backlog記法), one of the two per-project text formatting rules on Nulab Backlog — the other, and the default for new projects, is Markdown. Use when posting or editing formatted text on Backlog — issue descriptions (課題の説明), comments (コメント), wiki pages, pull requests — via the bee CLI or Backlog API; when converting Markdown to Backlog notation; when asked how to write headings, bold, tables (表), checklists, colored text, links, or code blocks in Backlog記法; or when the project's rule is unknown (this skill shows how to check textFormattingRule first — text posted in the wrong rule renders as literal characters). Do not use for projects confirmed to use Markdown, for Markdown files outside Backlog, or for Backlog operations with no text to format (status changes, assignees, listing data).
---

# backlog-notation

Backlog notation (Backlog記法) syntax reference.

## When this applies

Every Backlog project is set to one text formatting rule: **Markdown** (the default for new projects) or **Backlog notation**. This reference covers Backlog notation only. It is not a Backlog-wide standard, and it does not apply to Markdown projects — in those, write plain Markdown and ignore everything below.

Backlog renders text strictly by the project's rule: Backlog notation posted to a Markdown project (or vice versa) is not converted — it shows up as literal characters like `''bold''` or `**bold**`. So check the target project's setting before formatting anything:

```sh
bee project view -p PROJECT_KEY --json textFormattingRule
# {"textFormattingRule":"backlog"}   -> use this reference
# {"textFormattingRule":"markdown"}  -> use Markdown instead
```

If you cannot run bee (e.g. this skill is installed without it), fetch `/api/v2/projects/PROJECT_KEY` from the Backlog API and read `textFormattingRule`, or ask the user which rule the project uses.

Backlog notation is **not Markdown** — never mix the two syntaxes in one text.

## Quick Reference

| Feature            | Syntax                                                |
| ------------------ | ----------------------------------------------------- |
| Heading            | `* H1` / `** H2` / `*** H3` / `**** H4`               |
| Bold               | `''text''`                                            |
| Italic             | `'''text'''`                                          |
| Strikethrough      | `%%text%%`                                            |
| Color              | `&color(red) { text }`                                |
| Color + background | `&color(#fff, #333) { text }`                         |
| Bullet list        | `- item` (nest with `--`)                             |
| Numbered list      | `+ item` (nest with `++`)                             |
| Checklist          | `- [ ] todo` / `- [x] done` (issue descriptions only) |
| Link               | `[[https://example.com]]`                             |
| Labeled link       | `[[label>https://example.com]]`                       |
| Issue link         | `PROJECT-123` (auto-linked)                           |
| Quote              | `> text` or `{quote}...{/quote}`                      |
| Code block         | `{code}...{/code}`                                    |
| Code (lang)        | `{code:java}...{/code}`                               |
| Image              | `#image(URL or filename)`                             |
| Thumbnail          | `#thumbnail(URL or filename)` (< 200KB)               |
| Table of contents  | `#contents`                                           |
| Line break         | `&br;`                                                |
| Escape             | `\` before special characters                         |

## Tables

Separate cells with `|`. End a row with `h` for a header row. Prefix a cell with `~` for a row header. Use `>` to merge a cell with the one to its left.

```
|Name|Value|Note|h
|~Header|data 1|data 2|
|Span two||>|
```

## Markdown → Backlog Notation Conversion

| Markdown            | Backlog Notation       |
| ------------------- | ---------------------- |
| `# H1`              | `* H1`                 |
| `**bold**`          | `''bold''`             |
| `*italic*`          | `'''italic'''`         |
| `~~strike~~`        | `%%strike%%`           |
| `1. item`           | `+ item`               |
| ` ``` `             | `{code}` / `{/code}`   |
| `[text](url)`       | `[[text>url]]`         |
| `![alt](url)`       | `#image(url)`          |
| `\|---\|` separator | `\|h` at end of row    |
| N/A                 | `&color(red) { text }` |

## Complete Example

A realistic issue description combining the elements above:

```
* 障害報告: 画像アップロードが失敗する

** 概要
''2026-08-21 14:00'' 頃から、5MB 以上のファイルで失敗する。%%当初はネットワーク起因と推測%% → サーバ側の設定と判明。

** 再現手順
+ 課題画面を開く
+ 5MB 以上の画像を添付する
+ &color(red) { エラー「upload failed」が表示される }

** 環境
|項目|値|h
|~ブラウザ|Chrome 128|
|~プラン|スタンダード|

** 対応
- [x] 原因調査
- [ ] nginx の client_max_body_size を修正
- [ ] BUG-101 の再発防止策に反映

{code:shell}
curl -F "file=@large.png" https://xxx.backlog.com/api/v2/...
{/code}

詳細は [[運用wiki>https://xxx.backlog.com/wiki/PROJ/ops]] を参照。
```

## Gotchas

- No inline code syntax — only block-level `{code}...{/code}`
- `{quote}` blocks cannot be nested
- Checklists work only in issue descriptions, not in comments or wikis
- Supported code languages: `java`, `cs`, `js`, `python`, `ruby`, `perl`, `php`, `sql`, `html`, `xml`, `css`, `shell`, etc.
