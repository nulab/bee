---
title: bee issue view
description: 課題の詳細を表示する
---

```
bee issue view <issue> [flags]
```

Backlog の課題の詳細を表示します。

課題のサマリー、ステータス、種別、優先度、担当者、日付、説明を表示します。`--comments` を使うとコメントも取得・表示します。

`--web` を使うと、ターミナルで表示する代わりにデフォルトブラウザで課題を開きます。

## 引数

| 引数      | 説明                                      |
| --------- | ----------------------------------------- |
| `<issue>` | 課題 ID または課題キー。例: `PROJECT-123` |

## フラグ

| フラグ       | 短縮 | 説明                 |
| ------------ | ---- | -------------------- |
| `--comments` |      | コメントも表示する   |
| `--web`      | `-w` | ブラウザで課題を開く |
| `--json`     |      | JSON 形式で出力      |

## 使用例

```sh
# 課題の詳細を表示
bee issue view PROJECT-123

# コメント付きで表示
bee issue view PROJECT-123 --comments

# ブラウザで課題を開く
bee issue view PROJECT-123 --web

# JSON 形式で出力
bee issue view PROJECT-123 --json
```
