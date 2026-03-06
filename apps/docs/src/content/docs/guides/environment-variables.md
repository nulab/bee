---
title: 環境変数
description: bee で使用できる環境変数の一覧
---

環境変数を設定すると、頻繁に使うフラグを省略できます。

## 一覧

| 変数名                        | 説明                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `BACKLOG_SPACE`               | デフォルトのスペースホスト名（例: `xxx.backlog.com`） |
| `BACKLOG_PROJECT`             | デフォルトのプロジェクト ID またはプロジェクトキー    |
| `BACKLOG_REPO`                | デフォルトのリポジトリ名                              |
| `BACKLOG_API_KEY`             | API キーによる認証                                    |
| `BACKLOG_OAUTH_CLIENT_ID`     | OAuth クライアント ID                                 |
| `BACKLOG_OAUTH_CLIENT_SECRET` | OAuth クライアントシークレット                        |
| `BACKLOG_NO_INPUT`            | `1` に設定すると対話プロンプトを無効化                |

## よく使うパターン

### プロジェクトの固定

毎回 `--project` を指定する代わりに、環境変数を設定します。

```sh
export BACKLOG_PROJECT=MY_PROJECT
bee issue list            # --project MY_PROJECT と同じ
bee issue create          # プロジェクトが自動選択される
```

### シェルプロファイルへの設定

`.bashrc` や `.zshrc` に追加して永続化します。

```sh
export BACKLOG_SPACE=your-space.backlog.com
export BACKLOG_PROJECT=YOUR_PROJECT
```

### CI/CD での利用

非対話環境では `BACKLOG_API_KEY` と `BACKLOG_NO_INPUT=1` を組み合わせて使います。詳しくは [CI/CD での利用](/guides/ci-cd/) を参照してください。

```sh
export BACKLOG_API_KEY=your-api-key
export BACKLOG_SPACE=your-space.backlog.com
export BACKLOG_NO_INPUT=1
bee issue list --project MY_PROJECT
```
