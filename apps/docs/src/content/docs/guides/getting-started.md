---
title: はじめに
description: bee のインストールと基本的な使い方
---

## bee とは

bee は、[Backlog](https://backlog.com/) をターミナルから操作するためのコマンドラインツールです。課題の管理、プルリクエスト、Wiki、通知など、Backlog の主要な機能をコマンドラインから利用できます。

## インストール

```sh
npm install -g @nulab/bee
```

バージョンを確認してインストールが成功したことを確認します。

```sh
bee --version
```

## クイックスタート

### 1. ログイン

Backlog スペースにログインします。対話形式でスペースのホスト名と API キーを入力します。

```sh
bee auth login
```

API キーは Backlog の「個人設定 > API」から発行できます。

### 2. 課題を一覧表示する

プロジェクトの課題を一覧表示してみましょう。

```sh
bee issue list --project YOUR_PROJECT
```

`BACKLOG_PROJECT` 環境変数を設定しておくと、`--project` フラグを省略できます。

```sh
export BACKLOG_PROJECT=YOUR_PROJECT
bee issue list
```

### 3. 課題を作成する

対話形式で新しい課題を作成します。

```sh
bee issue create
```

フラグを指定して非対話的に作成することもできます。

```sh
bee issue create --summary "最初の課題" --issue-type Bug --priority High
```

### 4. もっと知る

- [認証](/guides/authentication/) — API キーと OAuth の使い分け
- [環境変数](/guides/environment-variables/) — 便利な設定
- [出力とフォーマット](/guides/output-formatting/) — `--json` の活用

## アンインストール

```sh
npm uninstall -g @nulab/bee
```
