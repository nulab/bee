---
title: bee issue comment
description: 課題にコメントを追加する
---

```
bee issue comment <issue> [flags]
```

Backlog の課題にコメントを追加します。

コメント本文は必須です。`-b -` で stdin から本文を読み取ることもできます。

## 引数

| 引数      | 説明                                      |
| --------- | ----------------------------------------- |
| `<issue>` | 課題 ID または課題キー。例: `PROJECT-123` |

## フラグ

| フラグ     | 短縮 | 説明                                            |
| ---------- | ---- | ----------------------------------------------- |
| `--body`   | `-b` | コメント本文。`-` で stdin から読み取り         |
| `--notify` |      | 通知するユーザー ID（カンマ区切りで複数指定可） |
| `--json`   |      | JSON 形式で出力                                 |

## 使用例

```sh
# コメントを追加
bee issue comment PROJECT-123 -b "This is a comment"

# stdin からコメントを追加
echo "Comment body" | bee issue comment PROJECT-123 -b -

# ユーザーに通知してコメントを追加
bee issue comment PROJECT-123 -b "FYI" --notify 12345,67890
```
