---
title: AI エージェントとの連携
description: AI エージェントから bee や Backlog MCP Server を活用する
---

bee はターミナルツールとして、AI エージェントの「手足」としても活用できます。LLM ベースのエージェントが Backlog のデータを取得・操作する手段として、bee と Backlog MCP Server の 2 つの選択肢があります。

## MCP Server の選択ガイド

### Backlog MCP Server

[Backlog MCP Server](https://github.com/nulab/backlog-mcp-server) は、Backlog API をネイティブに MCP（Model Context Protocol）化したサーバーです。

- 構造化されたツール定義により、エージェントが課題の検索・作成・更新などを直接実行できる
- API 操作の精度・網羅性が高い
- **API 操作が主目的なら第一選択**

### bee を MCP Server として使う

bee の CLI コマンドをそのまま MCP ツールとして公開する方法です。

- シェルパイプラインとの組み合わせなど、柔軟な操作が可能
- `bee browse` でブラウザを開くなど、CLI 固有の機能を利用できる
- フォーマット済みの人間向け出力が必要な場面に有効

### どちらを選ぶべきか

| 観点           | Backlog MCP Server | bee (CLI)                          |
| -------------- | ------------------ | ---------------------------------- |
| API 操作の精度 | 高い（ネイティブ） | CLI 経由                           |
| 柔軟性         | API スコープ内     | シェルパイプライン、外部ツール連携 |
| 人間向け出力   | JSON のみ          | テーブル / JSON 切り替え           |
| ブラウザ操作   | 不可               | `bee browse` で可能                |
| セットアップ   | MCP 設定のみ       | Node.js + bee インストール         |

**併用がおすすめ**: 両方を MCP サーバーとして登録し、場面に応じて使い分けるのが最も実用的です。API の CRUD 操作には Backlog MCP Server、ブラウザでの確認やパイプライン処理には bee を使う、といった運用ができます。

## `bee api` で柔軟な API アクセス

`bee api` コマンドを使うと、Backlog の任意の API エンドポイントを直接呼び出せます。MCP ツールとしてまだカバーされていない API にアクセスする場合に便利です。

```sh
# ユーザー情報の取得
bee api users/myself

# 課題の検索（クエリパラメータ付き）
bee api issues -f 'projectId[]=12345' -f count=5

# 課題の作成（POST）
bee api issues -X POST -f projectId=12345 -f summary="API から作成した課題"

# 特定フィールドだけ取得
bee api users/myself --json id,name,mailAddress
```

## `--json` を活用したデータ連携

AI エージェントに構造化データを渡すには、`--json` フラグが便利です。

```sh
# プロジェクトの課題をすべて JSON で取得
bee issue list --project MY_PROJECT --json

# 必要なフィールドだけに絞る
bee issue list --project MY_PROJECT --json id,summary,status,assignee
```

## プロンプト例

AI エージェントと bee を組み合わせた活用例です。

### 課題のサマリーレポート

```
プロジェクト MY_PROJECT の未完了課題を `bee issue list` で取得し、
担当者ごとにグループ化してサマリーレポートを作成してください。
```

### ステータスレポートの生成

```
`bee issue list` と `bee pr list` の結果を使って、
今週の進捗レポートを Markdown 形式で作成してください。
```

### 課題の一括整理

```
`bee issue list` で期限切れの課題を見つけ、
それぞれに「期限を確認してください」というコメントを
`bee issue comment` で追加してください。
```
