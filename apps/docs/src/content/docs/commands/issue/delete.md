---
title: bee issue delete
description: 課題を削除する
---

```
bee issue delete <issue> [flags]
```

Backlog の課題を削除します。

この操作は取り消せません。`--yes` フラグを指定しない限り、確認プロンプトが表示されます。

## 引数

| 引数      | 説明                                      |
| --------- | ----------------------------------------- |
| `<issue>` | 課題 ID または課題キー。例: `PROJECT-123` |

## フラグ

| フラグ   | 短縮 | 説明                     |
| -------- | ---- | ------------------------ |
| `--yes`  | `-y` | 確認プロンプトをスキップ |
| `--json` |      | JSON 形式で出力          |

## 使用例

```sh
# 課題を削除（確認あり）
bee issue delete PROJECT-123

# 確認なしで課題を削除
bee issue delete PROJECT-123 --yes
```
