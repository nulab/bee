---
title: bee issue list
description: 課題の一覧を表示する
---

```
bee issue list [flags]
```

1 つ以上の Backlog プロジェクトから課題を一覧表示します。

デフォルトでは更新日時の降順でソートされます。フィルタリングフラグを使って、担当者・ステータス・優先度などで結果を絞り込めます。

複数のプロジェクトキーはカンマ区切りで指定できます。

## フラグ

| フラグ            | 短縮 | 説明                                                                    |
| ----------------- | ---- | ----------------------------------------------------------------------- |
| `--project`       | `-p` | プロジェクト ID またはプロジェクトキー（カンマ区切りで複数指定可）      |
| `--assignee`      | `-a` | 担当者のユーザー ID（カンマ区切りで複数指定可）。`@me` で自分自身を指定 |
| `--status`        | `-S` | ステータス ID（カンマ区切りで複数指定可）                               |
| `--priority`      | `-P` | 優先度 ID（カンマ区切りで複数指定可）                                   |
| `--keyword`       | `-k` | キーワード検索                                                          |
| `--created-since` |      | 作成日の開始日（yyyy-MM-dd）                                            |
| `--created-until` |      | 作成日の終了日（yyyy-MM-dd）                                            |
| `--updated-since` |      | 更新日の開始日（yyyy-MM-dd）                                            |
| `--updated-until` |      | 更新日の終了日（yyyy-MM-dd）                                            |
| `--due-since`     |      | 期限日の開始日（yyyy-MM-dd）                                            |
| `--due-until`     |      | 期限日の終了日（yyyy-MM-dd）                                            |
| `--sort`          |      | ソートフィールド                                                        |
| `--order`         |      | ソート順。`asc` または `desc`                                           |
| `--count`         | `-L` | 取得件数（1-100、デフォルト: 20）                                       |
| `--offset`        |      | ページネーション用オフセット                                            |
| `--json`          |      | JSON 形式で出力                                                         |

## 使用例

```sh
# プロジェクトの課題を一覧表示
bee issue list -p PROJECT

# 自分が担当の課題を表示
bee issue list -p PROJECT -a @me

# キーワードと優先度でフィルタリング
bee issue list -p PROJECT -k "login bug" --priority 高

# JSON 形式で出力
bee issue list -p PROJECT --json
```

## 環境変数

| 変数              | 説明                                               |
| ----------------- | -------------------------------------------------- |
| `BACKLOG_PROJECT` | デフォルトのプロジェクト ID またはプロジェクトキー |
