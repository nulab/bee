---
title: bee issue status
description: 自分の課題をステータス別に表示する
---

```
bee issue status [flags]
```

自分が担当している課題のサマリーをステータス別にグループ化して表示します。

担当者が自分である課題を取得し、現在のステータス（例: 未対応、処理中、処理済み）ごとに整理して表示します。

## フラグ

| フラグ   | 説明            |
| -------- | --------------- |
| `--json` | JSON 形式で出力 |

## 使用例

```sh
# 自分の課題のステータスサマリーを表示
bee issue status

# JSON 形式で出力
bee issue status --json
```
