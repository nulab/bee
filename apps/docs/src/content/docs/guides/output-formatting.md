---
title: 出力とフォーマット
description: bee の出力形式とデータ活用
---

## テーブル出力

bee のリスト系コマンドは、デフォルトで人間が読みやすいテーブル形式で出力します。

```sh
bee issue list --project MY_PROJECT
```

## JSON 出力

`--json` フラグを付けると、JSON 形式で出力されます。スクリプトや他のツールとの連携に便利です。

```sh
bee issue list --project MY_PROJECT --json
```

### フィールドの絞り込み

`--json` にフィールド名をカンマ区切りで指定すると、出力するフィールドを絞り込めます。

```sh
bee issue view PROJECT-123 --json id,summary,status
```

### jq との組み合わせ

JSON 出力を `jq` と組み合わせると、柔軟なデータ加工ができます。

```sh
# 課題のサマリーだけを取り出す
bee issue list --project MY_PROJECT --json | jq '.[].summary'

# 優先度が「高」の課題数をカウント
bee issue list --project MY_PROJECT --json | jq '[.[] | select(.priority.id == 2)] | length'

# 担当者ごとの課題数
bee issue list --project MY_PROJECT --json | jq 'group_by(.assignee.name) | map({name: .[0].assignee.name, count: length})'
```

## パイプラインの活用

bee の出力を他のコマンドと組み合わせる例です。

```sh
# 課題キーの一覧をファイルに出力
bee issue list --project MY_PROJECT --json | jq -r '.[].issueKey' > issues.txt

# 複数の課題を一括クローズ
cat issues.txt | xargs -I {} bee issue close {}
```
