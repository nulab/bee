---
title: bee issue edit
description: 課題を編集する
---

```
bee issue edit <issue> [flags]
```

既存の Backlog の課題を更新します。

指定されたフィールドのみが更新されます。指定しなかったフィールドはそのまま変更されません。

## 引数

| 引数      | 説明                                      |
| --------- | ----------------------------------------- |
| `<issue>` | 課題 ID または課題キー。例: `PROJECT-123` |

## フラグ

| フラグ              | 短縮 | 説明                                            |
| ------------------- | ---- | ----------------------------------------------- |
| `--title`           | `-t` | 新しいサマリー                                  |
| `--description`     | `-d` | 新しい詳細                                      |
| `--status`          | `-S` | 新しいステータス ID                             |
| `--priority`        | `-P` | 新しい優先度。`high`、`normal`、`low`           |
| `--type`            | `-T` | 新しい種別 ID                                   |
| `--assignee`        |      | 新しい担当者のユーザー ID                       |
| `--resolution`      |      | 完了理由 ID                                     |
| `--parent-issue`    |      | 新しい親課題 ID                                 |
| `--start-date`      |      | 新しい開始日（yyyy-MM-dd）                      |
| `--due-date`        |      | 新しい期限日（yyyy-MM-dd）                      |
| `--estimated-hours` |      | 新しい予定時間                                  |
| `--actual-hours`    |      | 新しい実績時間                                  |
| `--comment`         | `-c` | 更新時に追加するコメント                        |
| `--notify`          |      | 通知するユーザー ID（カンマ区切りで複数指定可） |
| `--attachment`      |      | 添付ファイル ID（カンマ区切りで複数指定可）     |
| `--json`            |      | JSON 形式で出力                                 |

## 使用例

```sh
# 課題のサマリーを更新
bee issue edit PROJECT-123 -t "New title"

# 担当者と優先度を変更
bee issue edit PROJECT-123 --assignee 12345 --priority high

# コメント付きで更新
bee issue edit PROJECT-123 -t "New title" --comment "Updated title"
```
