---
title: bee issue close
description: 課題を完了にする
---

```
bee issue close <issue> [flags]
```

Backlog の課題のステータスを「完了」に設定します。

デフォルトの完了理由は「対処済み」です。`--resolution` で別の完了理由を指定できます。

`--comment` フラグでコメントを添えることもできます。

## 引数

| 引数      | 説明                                      |
| --------- | ----------------------------------------- |
| `<issue>` | 課題 ID または課題キー。例: `PROJECT-123` |

## フラグ

| フラグ         | 短縮 | 説明                                                                                             |
| -------------- | ---- | ------------------------------------------------------------------------------------------------ |
| `--comment`    | `-c` | 完了時に追加するコメント                                                                         |
| `--resolution` |      | 完了理由。`fixed`\|`wont-fix`\|`invalid`\|`duplicate`\|`cannot-reproduce`（デフォルト: `fixed`） |
| `--notify`     |      | 通知するユーザー ID（カンマ区切りで複数指定可）                                                  |
| `--json`       |      | JSON 形式で出力                                                                                  |

## 使用例

```sh
# 課題を完了にする
bee issue close PROJECT-123

# コメント付きで完了にする
bee issue close PROJECT-123 -c "Done"

# 重複として完了にする
bee issue close PROJECT-123 --resolution duplicate
```
