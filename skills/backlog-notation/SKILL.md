---
name: backlog-notation
description: Use when writing or converting text in Backlog notation (Backlog記法) — the native markup syntax used in Nulab Backlog for issues, wikis, pull requests, and comments. Do NOT use for Markdown-formatted Backlog projects.
---

# backlog-notation

Backlog notation (Backlog記法) is the native markup syntax for Nulab Backlog. It is **not Markdown**. Projects that use Backlog notation require this specific syntax for issues, wikis, PRs, and comments.

> **When to use:** The user's Backlog project is configured to use **Backlog記法** (not Markdown). If the project uses Markdown, use standard Markdown instead.

## Quick Reference

| Feature | Syntax |
|---|---|
| Heading | `* H1` / `** H2` / `*** H3` |
| Bold | `''bold''` |
| Italic | `'''italic'''` |
| Strikethrough | `%%strikethrough%%` |
| Color | `&color(red) { text }` |
| Background color | `&color(#fff, #333) { text }` |
| Bullet list | `- item` |
| Numbered list | `+ item` |
| Checklist | `- [ ] todo` / `- [x] done` |
| Link (URL) | `[[https://example.com]]` |
| Link (labeled) | `[[label>https://example.com]]` |
| Issue link | `PROJECT-123` or `[[PROJECT-123]]` |
| Quote (inline) | `> quoted text` |
| Quote (block) | `{quote} ... {/quote}` |
| Code (block) | `{code} ... {/code}` |
| Code (syntax) | `{code:java} ... {/code}` |
| Image | `#image(URL)` |
| Thumbnail | `#thumbnail(URL)` |
| Table of contents | `#contents` |
| Line break | `&br;` |
| Escape | `\` before special characters |

## Headings

Lines starting with `*` become headings. More `*` = deeper level.

```
* Heading 1
** Heading 2
*** Heading 3
**** Heading 4
```

## Lists

### Bullet list

```
- Item 1
- Item 2
-- Nested item
-- Nested item
- Item 3
```

### Numbered list

```
+ First
+ Second
++ Nested numbered
+ Third
```

### Checklist (issue descriptions only)

```
- [ ] Not done
- [x] Done
```

## Text Styling

```
''bold text''
'''italic text'''
%%strikethrough text%%
&color(red) { red text }
&color(#ffffff, #8abe00) { text with background color }
```

- `&color(colorName) { text }` — sets text color
- `&color(textColor, bgColor) { text }` — sets text and background color
- Colors accept names (`red`, `blue`) or hex codes (`#ff0000`)

## Links

```
[[https://example.com]]
[[Click here>https://example.com]]
[[PROJECT-123]]
```

Issue keys written directly (e.g., `PROJECT-123`) are automatically linked.

## Tables

Cells are separated by `|`. End a row with `h` to make it a header row. Prefix a cell with `~` to make that cell a header.

```
|Column A|Column B|Column C|h
|data 1|data 2|data 3|
|~Row header|data 4|data 5|
```

To merge cells horizontally, use `>` in the cell to be merged:

```
|Span two columns|>|Column C|h
|data 1|data 2|data 3|
```

## Quotes

Single-line:

```
> This is a quote.
```

Multi-line:

```
{quote}
This is a
multi-line quote.
{/quote}
```

## Code Blocks

Generic code:

```
{code}
const x = 1;
{/code}
```

With syntax highlighting (supported: `java`, `cs`, `js`, `python`, `ruby`, `perl`, `php`, `sql`, `html`, `xml`, `css`, `shell`, etc.):

```
{code:java}
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
{/code}
```

## Images

```
#image(https://example.com/image.png)
#thumbnail(https://example.com/image.png)
```

For wiki-attached files:

```
#image(filename.png)
#thumbnail(filename.png)
```

Thumbnail display requires the image to be under 200KB.

## Table of Contents

```
#contents
```

Automatically generates a table of contents from headings on the page.

## Line Break

```
Text before&br;Text after
```

## Escape Special Characters

Prefix with `\` to display literal special characters:

```
\* Not a heading
\- Not a list
```

## Key Differences from Markdown

| Feature | Markdown | Backlog Notation |
|---|---|---|
| Heading | `# H1` | `* H1` |
| Bold | `**bold**` | `''bold''` |
| Italic | `*italic*` | `'''italic'''` |
| Strikethrough | `~~text~~` | `%%text%%` |
| Bullet list | `- item` | `- item` (same) |
| Numbered list | `1. item` | `+ item` |
| Code block | `` ``` `` | `{code}` / `{/code}` |
| Quote | `> text` | `> text` or `{quote}` (same/extended) |
| Link | `[text](url)` | `[[text>url]]` |
| Image | `![alt](url)` | `#image(url)` |
| Text color | N/A | `&color(red) { text }` |
| Table header | `\|---|` separator | `\|h` at end of row |

## Tips

- When converting Markdown to Backlog notation, pay special attention to headings (`#` → `*`), bold (`**` → `''`), and code blocks.
- `{quote}` blocks cannot be nested.
- Checklist syntax only works in issue descriptions, not in comments or wiki pages.
- Backlog notation does **not** support inline code (backtick). Use `{code}...{/code}` for code blocks only.
