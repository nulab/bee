---
name: backlog-notation
description: Syntax reference for Backlog notation (Backlog記法), one of the two text formatting rules a Nulab Backlog project can be set to — the other, and the default for new projects, is Markdown. Applies only to projects whose textFormattingRule is `backlog`; it is not a Backlog-wide standard and does not apply to Markdown projects. Covers headings, lists, tables, text styling, links, code blocks, and other formatting elements.
---

# backlog-notation

Backlog notation (Backlog記法) syntax reference.

## When this applies

Every Backlog project is set to one text formatting rule: **Markdown** (the default for new projects) or **Backlog notation**. This reference covers Backlog notation only. It is not a Backlog-wide standard, and it does not apply to Markdown projects — in those, write plain Markdown and ignore everything below.

Check the target project's setting before formatting anything:

```sh
bee project view -p PROJECT_KEY --json textFormattingRule
# {"textFormattingRule":"backlog"}   -> use this reference
# {"textFormattingRule":"markdown"}  -> use Markdown instead
```

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

## Gotchas

- No inline code syntax — only block-level `{code}...{/code}`
- `{quote}` blocks cannot be nested
- Checklists work only in issue descriptions, not in comments or wikis
- Supported code languages: `java`, `cs`, `js`, `python`, `ruby`, `perl`, `php`, `sql`, `html`, `xml`, `css`, `shell`, etc.
