---
title: bee issue reopen
description: 課題を再オープンする
---

```
bee issue reopen <issue> [flags]
```

完了した Backlog の課題のステータスを「未対応」に戻します。

`--comment` フラグでコメントを添えることもできます。

## 引数

| 引数      | 説明                                      |
| --------- | ----------------------------------------- |
| `<issue>` | 課題 ID または課題キー。例: `PROJECT-123` |

## フラグ

| フラグ      | 短縮 | 説明                                            |
| ----------- | ---- | ----------------------------------------------- |
| `--comment` | `-c` | 再オープン時に追加するコメント                  |
| `--notify`  |      | 通知するユーザー ID（カンマ区切りで複数指定可） |
| `--json`    |      | JSON 形式で出力                                 |

## 使用例

```sh
# 課題を再オープン
bee issue reopen PROJECT-123

# コメント付きで再オープン
bee issue reopen PROJECT-123 -c "Reopening due to regression"
```
