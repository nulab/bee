---
title: CI/CD での利用
description: CI/CD パイプラインから bee を使う
---

bee は CI/CD 環境でも利用できます。自動テストやデプロイのパイプラインから Backlog の課題やプルリクエストを操作できます。

## セットアップ

### 認証

CI/CD では API キー認証を使います。環境変数に API キーとスペース情報を設定してください。

```sh
export BACKLOG_API_KEY=your-api-key
export BACKLOG_SPACE=your-space.backlog.com
```

### 対話プロンプトの無効化

CI/CD 環境では対話プロンプトが使えないため、`BACKLOG_NO_INPUT=1` を設定します。

```sh
export BACKLOG_NO_INPUT=1
```

## GitHub Actions での例

### 課題のステータス更新

デプロイ完了時に関連する課題のステータスを更新する例です。

```yaml
name: Update Backlog Issue
on:
  push:
    branches: [main]

jobs:
  update-issue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "24"

      - run: npm install -g @nulab/bee

      - name: Close related issue
        env:
          BACKLOG_API_KEY: ${{ secrets.BACKLOG_API_KEY }}
          BACKLOG_SPACE: ${{ secrets.BACKLOG_SPACE }}
          BACKLOG_NO_INPUT: "1"
        run: bee issue close PROJECT-123
```

### コミットメッセージから課題キーを抽出

```yaml
- name: Extract issue key from commit message
  id: extract
  run: echo "issue_key=$(git log -1 --pretty=%s | grep -oP '[A-Z_]+-\d+')" >> "$GITHUB_OUTPUT"

- name: Add comment to issue
  if: steps.extract.outputs.issue_key != ''
  env:
    BACKLOG_API_KEY: ${{ secrets.BACKLOG_API_KEY }}
    BACKLOG_SPACE: ${{ secrets.BACKLOG_SPACE }}
    BACKLOG_NO_INPUT: "1"
  run: bee issue comment ${{ steps.extract.outputs.issue_key }} --body "Deployed in ${{ github.sha }}"
```

## セキュリティ上の注意

- API キーは **シークレット** として管理してください（GitHub Actions の場合は Repository secrets）
- ログに API キーが出力されないよう注意してください
- CI/CD 専用の API キーを発行し、必要最小限の権限に絞ることを推奨します
