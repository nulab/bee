---
title: AI エージェントとの連携
description: AI エージェントから bee や Backlog MCP Server を活用する
---

bee はターミナルツールとして、AI エージェントの「手足」としても活用できます。LLM ベースのエージェントが Backlog のデータを取得・操作する手段として、大きく 2 つのアプローチがあります。

## どちらを使うべきか

### bee + Skills（CLI ベース）

bee の CLI コマンドを AI エージェントの Skill として登録し、エージェントが直接呼び出せるようにする方法です。

```sh
npx skills add nulab/bee --skill using-bee
```

- シェルパイプラインとの組み合わせなど、柔軟な操作が可能
- `bee browse` でブラウザを開くなど、CLI 固有の機能を利用できる
- Skill が適切なコマンドの使い方をエージェントに教えるため、プロンプトでコマンド詳細を指定する必要がない

### Backlog MCP Server

[Backlog MCP Server](https://github.com/nulab/backlog-mcp-server) は、Backlog API をネイティブに MCP（Model Context Protocol）化したサーバーです。

- 構造化されたツール定義により、エージェントが課題の検索・作成・更新などを直接実行できる
- MCP 対応のクライアント（Claude Desktop 等）からそのまま使える

### 選び方

| 観点         | bee + Skills                             | Backlog MCP Server                      |
| ------------ | ---------------------------------------- | --------------------------------------- |
| 利用環境     | Claude Code などターミナル操作可能な環境 | Claude Desktop などMCP 対応クライアント |
| セットアップ | Node.js + bee インストール               | MCP 設定のみ                            |
| 柔軟性       | シェルパイプライン、外部ツール連携       | API スコープ内                          |
| ブラウザ操作 | `bee browse` で可能                      | 不可                                    |
| 人間向け出力 | テーブル / JSON 切り替え                 | JSON のみ                               |

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

bee の Skill (`/using-bee`) を導入していれば、エージェントが適切なコマンドを自動的に選択します。プロンプトでは具体的なコマンドを指定する必要はありません。

```
プロジェクト MY_PROJECT の未完了課題を担当者ごとにグループ化して、
サマリーレポートを作成してください。
```

```
今週の課題とプルリクエストの進捗レポートを Markdown 形式で作成してください。
```

```
期限切れの課題を見つけて、それぞれに「期限を確認してください」というコメントを追加してください。
```

エージェントがうまく bee を使えない場合は、プロンプトに `/using-bee` を含めてください。
