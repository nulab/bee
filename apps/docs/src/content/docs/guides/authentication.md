---
title: 認証
description: bee の認証方式とセットアップ
---

bee は 2 つの認証方式をサポートしています。

## API キー認証

もっともシンプルな認証方式です。Backlog の個人設定から API キーを発行して使用します。

```sh
bee auth login
```

対話形式でスペースのホスト名（例: `xxx.backlog.com`）と API キーの入力を求められます。API キーは Backlog の **個人設定 > API** から発行できます。

`BACKLOG_API_KEY` と `BACKLOG_SPACE` 環境変数を設定しておけば、`bee auth login` を実行しなくても認証済みの状態で bee を使えます。

```sh
export BACKLOG_API_KEY=your-api-key
export BACKLOG_SPACE=xxx.backlog.com
bee issue list --project MY_PROJECT
```

### パイプで API キーを渡す

`--with-token` フラグを使うと、標準入力から API キーを渡せます。セットアップスクリプトや CI 環境で便利です。

```sh
echo 'your-api-key' | BACKLOG_SPACE=xxx.backlog.com bee auth login --with-token
```

## OAuth 認証

OAuth を使うと、API キーを直接扱わずに認証できます。事前に Backlog で OAuth クライアントを登録する必要があります。

```sh
bee auth login --method oauth
```

ブラウザが開き、Backlog の認証画面が表示されます。承認するとトークンが自動的に取得されます。

OAuth クライアント ID とシークレットは、フラグまたは環境変数で指定できます。

```sh
bee auth login --method oauth --client-id YOUR_ID --client-secret YOUR_SECRET
```

```sh
export BACKLOG_OAUTH_CLIENT_ID=YOUR_ID
export BACKLOG_OAUTH_CLIENT_SECRET=YOUR_SECRET
bee auth login --method oauth
```

## どちらを選ぶべきか

|              | API キー           | OAuth                          |
| ------------ | ------------------ | ------------------------------ |
| セットアップ | シンプル           | OAuth クライアントの登録が必要 |
| セキュリティ | API キーを直接管理 | トークンの自動更新             |
| 用途         | 個人利用、CI/CD    | チームでの利用、長期運用       |

## 複数スペースの管理

複数の Backlog スペースにログインしている場合、`bee auth switch` でアクティブなスペースを切り替えられます。

```sh
bee auth switch
```

現在の認証状態は `bee auth status` で確認できます。

```sh
bee auth status
```

## 関連コマンド

- [`bee auth login`](/commands/auth/login) — ログイン
- [`bee auth logout`](/commands/auth/logout) — ログアウト
- [`bee auth status`](/commands/auth/status) — 認証状態の確認
- [`bee auth switch`](/commands/auth/switch) — スペースの切り替え
- [`bee auth token`](/commands/auth/token) — トークンの表示
- [`bee auth refresh`](/commands/auth/refresh) — OAuth トークンの更新
