---
title: CI/CD での利用
description: CI/CD パイプラインから bee を使う
---

bee は CI/CD 環境でも利用できます。自動テストやデプロイのパイプラインから Backlog の課題やプルリクエストを操作できます。

## セットアップ

CI/CD では API キー認証を使います。環境変数に API キーとスペース情報を設定してください。

```sh
export BACKLOG_API_KEY=your-api-key
export BACKLOG_SPACE=your-space.backlog.com
```

## GitHub Actions での例

マージされた PR のタイトルから課題キーを抽出し、課題をクローズする例です。PR タイトルは `PROJECT-123: タイトル` の形式を前提としています。

```yaml
name: Close Backlog Issue
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  close-issue:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Extract issue key from PR title
        id: extract
        run: echo "issue_key=$(echo '${{ github.event.pull_request.title }}' | grep -oP '^[A-Z_]+-\d+')" >> "$GITHUB_OUTPUT"

      - name: Close issue
        if: steps.extract.outputs.issue_key != ''
        env:
          BACKLOG_API_KEY: ${{ secrets.BACKLOG_API_KEY }}
          BACKLOG_SPACE: ${{ secrets.BACKLOG_SPACE }}
        run: npx @nulab/bee issue close ${{ steps.extract.outputs.issue_key }}
```
