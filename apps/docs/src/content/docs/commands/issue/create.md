---
title: bee issue create
description: 課題を作成する
---

```
bee issue create [flags]
```

新しい Backlog の課題を作成します。

プロジェクト、サマリー、種別 ID、優先度が必須です。対話的に実行した場合、省略された必須フィールドはプロンプトで入力を求められます。

種別は数値 ID を受け付けます。優先度は名前（`high`、`normal`、`low`）で指定します。

## フラグ

| フラグ              | 短縮 | 説明                                            |
| ------------------- | ---- | ----------------------------------------------- |
| `--project`         | `-p` | プロジェクト ID またはプロジェクトキー          |
| `--title`           | `-t` | 課題のサマリー                                  |
| `--type`            | `-T` | 種別 ID                                         |
| `--priority`        | `-P` | 優先度。`high`、`normal`、`low`                 |
| `--description`     | `-d` | 課題の詳細                                      |
| `--assignee`        |      | 担当者のユーザー ID。`@me` で自分自身を指定     |
| `--parent-issue`    |      | 親課題 ID                                       |
| `--start-date`      |      | 開始日（yyyy-MM-dd）                            |
| `--due-date`        |      | 期限日（yyyy-MM-dd）                            |
| `--estimated-hours` |      | 予定時間                                        |
| `--actual-hours`    |      | 実績時間                                        |
| `--notify`          |      | 通知するユーザー ID（カンマ区切りで複数指定可） |
| `--attachment`      |      | 添付ファイル ID（カンマ区切りで複数指定可）     |
| `--json`            |      | JSON 形式で出力                                 |

## 使用例

```sh
# 必須フィールドを指定して課題を作成
bee issue create -p PROJECT --type 1 --priority normal -t "Fix login bug"

# 詳細付きで課題を作成
bee issue create -p PROJECT --type 1 --priority normal -t "Title" -d "Details here"

# 自分を担当者にして課題を作成
bee issue create -p PROJECT --type 1 --priority normal -t "Title" --assignee @me

# JSON 形式で出力
bee issue create -p PROJECT --type 1 --priority normal -t "Title" --json
```

## 環境変数

| 変数              | 説明                                               |
| ----------------- | -------------------------------------------------- |
| `BACKLOG_PROJECT` | デフォルトのプロジェクト ID またはプロジェクトキー |
