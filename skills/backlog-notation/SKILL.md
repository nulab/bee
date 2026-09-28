---
name: backlog-notation
description: Syntax reference for Backlog notation (Backlog記法), the non-Markdown text format that a Nulab Backlog project can be set to. Use it only when the target project is known to use Backlog notation, which means the user or the project instructions (AGENTS.md, CLAUDE.md) say so, or `textFormattingRule` is `backlog`. Also use it when the user asks about Backlog記法 syntax, or asks to convert between Markdown and Backlog記法 in either direction (Markdown から Backlog記法への変換). It is not the default: new projects use Markdown, and documents (ドキュメント) always use Markdown. So do not use this skill just because text is going to Backlog, and do not use it while the project's format is still unknown. Find the format first (the using-bee skill shows how).
---

# backlog-notation

A syntax guide for Backlog notation (Backlog記法).

## Before You Use This

Each Backlog project uses one text format: **Markdown** or **Backlog notation**. New projects use Markdown by default. This guide covers only Backlog notation. Backlog notation is one of two choices. It is not the format for all Backlog text.

Use the syntax below only when both points are true:

1. **The text is for an issue description, a comment, a wiki page, or a pull request.** Documents (ドキュメント) always use Markdown, even when the project uses Backlog notation.
2. **You know that the project uses Backlog notation.** The user or the project instructions say so, or this check returned `backlog`. If the user called this skill by name for a post, that counts as the user saying so:

   ```sh
   bee project view -p PROJECT_KEY --json textFormattingRule
   # {"textFormattingRule":"backlog"}   -> use this reference
   # {"textFormattingRule":"markdown"}  -> write Markdown instead
   ```

   If bee is not available, read `textFormattingRule` from `GET /api/v2/projects/PROJECT_KEY`. You can also ask the user.

If either point is false, or you do not know the format, do not use this syntax. Backlog shows text written in the wrong format as plain characters. For example, a Markdown project shows `''bold''` as written.

Backlog notation is **not Markdown**. Do not mix the two formats in the same text.

## Quick Reference

| Feature            | Syntax                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| Heading            | `* H1` / `** H2` / `*** H3` / `**** H4`                                   |
| Bold               | `''text''`                                                                |
| Italic             | `'''text'''`                                                              |
| Strikethrough      | `%%text%%`                                                                |
| Color              | `&color(red) { text }`                                                    |
| Color + background | `&color(#fff, #333) { text }`                                             |
| Bullet list        | `- item` (use `--` for nested items)                                      |
| Numbered list      | `+ item` (use `++` for nested items)                                      |
| Checklist          | `- [ ] todo` / `- [x] done` (issue descriptions only)                     |
| Link               | `[[https://example.com]]`                                                 |
| Labeled link       | `[[label>https://example.com]]`                                           |
| Issue link         | `PROJECT-123` (linked automatically)                                      |
| Mention            | `<@U12345>` (numeric user ID, same as in Markdown; `@Name` is plain text) |
| Quote              | `> text` or `{quote}...{/quote}`                                          |
| Code block         | `{code}...{/code}`                                                        |
| Code with language | `{code:java}...{/code}`                                                   |
| Image              | `#image(URL or filename)`                                                 |
| Thumbnail          | `#thumbnail(URL or filename)` (< 200KB)                                   |
| Table of contents  | `#contents`                                                               |
| Line break         | `&br;`                                                                    |
| Escape             | Put `\` before special characters                                         |

## Tables

Use `|` to separate cells. Put `h` at the end of a header row. Put `~` at the start of a row header cell. Use `>` to join a cell with the cell on its left.

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

This example shows a realistic issue description that uses the features above:

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

- There is no inline code syntax. Use only block-level `{code}...{/code}`.
- You cannot put a `{quote}` block inside another `{quote}` block.
- Checklists work only in issue descriptions. They do not work in comments or wikis.
- Supported code languages include `java`, `cs`, `js`, `python`, `ruby`, `perl`, `php`, `sql`, `html`, `xml`, `css`, `shell`, etc.
