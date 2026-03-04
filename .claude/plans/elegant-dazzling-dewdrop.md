# 「bee CLI」ブランディング評価 — Datadog スタイル

## 背景

- Backlog ロゴの「b」の音と形から蜂（bee）を連想
- Datadog の犬マスコット「Bits」を軸としたブランディングをモデルにしたい
- Datadog は CLI ツールを `dog`（Dogshell）、`pup`、`dogleash` など犬テーマで統一

## Datadog のブランディング戦略（参考）

| 要素 | Datadog のアプローチ |
|------|---------------------|
| マスコット | 犬「Bits」— 白い犬、紫背景 |
| CLI ツール名 | `dog`, `pup`, `dogleash` — すべて犬テーマ |
| ブランドカラー | 紫（Datadog Purple） |
| メタファー | 犬 = 見張り番、忠実な監視者 → インフラ監視の性格にマッチ |
| 一貫性 | DogStatsD, DogFood 等、エコシステム全体で犬テーマ |
| 効果 | エンタープライズ向けなのに親しみやすい印象を実現 |

**核心**: マスコットがプロダクトの性格を体現し、ツール名から世界観までを一貫させている。

---

## bee CLI に適用した場合の評価

### Datadog モデルの要素を bee に置き換え

| Datadog (犬) | bee CLI (蜂) | 対応関係 |
|--------------|-------------|----------|
| 犬 = 監視・忠実 | 蜂 = 勤勉・協働 | プロジェクト管理の性格にマッチ |
| `dog` (メインCLI) | `bee` (メインCLI) | メインコマンド |
| `pup` (サブツール) | 将来的に蜂テーマのサブツール展開も可能 | エコシステム |
| Bits (マスコット名) | マスコット蜂キャラに名前を付ける余地 | キャラクター |
| 紫 (ブランドカラー) | 黄色×黒（蜂のストライプ）or Backlog 既存カラーとの融合 | ビジュアル |

### 蜂メタファーの強み

Datadog が「犬 = 監視者」でモニタリングツールを表現したように、蜂はプロジェクト管理ツールの性格を多面的に表現できる:

- **勤勉 (busy as a bee)** → タスクをこなす
- **群れ・コロニー** → チームコラボレーション
- **ハニカム（六角形の巣）** → 構造化された情報整理
- **蜜を集める** → 情報・成果の集約
- **女王蜂と働き蜂** → ロールベースの作業分担

### Datadog スタイルで強化できるポイント

**1. ツール名の世界観統一**

Datadog が `dog` / `pup` / `dogleash` で犬テーマを貫くように:

```
bee          — メインCLI（Backlog操作全般）
bee hive     — スペース/プロジェクト管理（巣 = ワークスペース）
bee sting    — クイックアクション系（素早い一刺し）
bee honey    — レポート/集計系（蜜 = 成果物）
```

※ サブコマンドの命名にまで蜂テーマを入れるかは好み次第。Datadog でも `datadog-ci` のサブコマンド自体は普通の名前。

**2. マスコットキャラクターの設定**

Datadog の「Bits」のように、蜂マスコットに名前を付ける:
- CLI のヘルプや docs に蜂キャラを登場させる
- エラーメッセージやウェルカムメッセージに個性を持たせる余地

**3. ヘルプ出力のブランディング**

```
bee — a CLI for Backlog 🐝

USAGE
  bee <command> [flags]

COMMANDS
  auth      Authenticate bee with Backlog
  issue     Manage issues
  project   Manage projects
  ...
```

Datadog の Dogshell が `dog` コマンドとして自然に使えるように、`bee auth login` も直感的。

**4. 用語の統一**

| 概念 | 蜂テーマの表現（オプション） |
|------|----------------------------|
| ワークスペース/スペース | hive |
| タスク/課題 | task（無理に蜂にしない） |
| 設定ファイル | `.beerc` or `.bee/config` |

※ Datadog も全部を犬にしているわけではない。メタファーは名前とビジュアルに集中させ、機能名は明快さを優先。

---

## 総合評価

**Datadog モデルを参考にすることで、bee CLI のブランディングは「コマンド名の洒落」から「一貫した世界観」に格上げできる。**

Datadog が成功している理由:
1. マスコットがプロダクトの本質を体現（犬 = 監視）
2. ツール名で世界観を感じさせる（dog, pup）
3. でも機能名は実用的（過度にテーマに寄せない）

これと同じ構造で bee CLI を設計すれば:
1. 蜂がプロジェクト管理の本質を体現（勤勉・協働）
2. コマンド名 `bee` で世界観を感じさせる
3. サブコマンドは実用的（`auth`, `issue`, `project`）
4. Backlog ロゴの「b」→ bee で、ブランドの起源ストーリーが明快

**推奨: 採用して良い。Datadog の precedent があることで、エンタープライズ向けツールでもマスコット型ブランディングが機能する実証がある。**

### 採用時の方針

| 項目 | 方針 |
|------|------|
| コマンド名 | `bee` のみ（未リリースのため後方互換エイリアス不要。Datadog pup も単一コマンド） |
| パッケージ名 | `@nulab/bee` (description に "Backlog" を含む) |
| 環境変数 | `BACKLOG_*` を維持（サービス接続情報のため） |
| サブコマンド名 | 実用的な名前を維持（auth, issue, project 等） |
| ヘルプ表示 | 「bee — a CLI for Backlog」をヘッダーに |
| ドキュメント | ロゴ → bee のストーリーを紹介 |
| マスコット | 将来的にキャラ設定の余地を残す |

---

## 採用する場合の変更箇所

1. `apps/cli/package.json` — `name` → `@nulab/bee`、`bin` → `{ "bee": ... }`
2. `apps/cli/src/index.ts` — `meta.name` → `"bee"`
3. 全コマンドの `commandUsage` — 例示中の `bl` → `bee`
4. 環境変数 — **変更なし**（`BACKLOG_*` を維持）
5. `apps/docs/` — サイトタイトル、説明文、コマンド例の更新
6. `CLAUDE.md` — プロジェクト説明の更新
7. `README.md` — ブランディング更新、ロゴストーリーの紹介

---

Sources:
- [Datadog Pup CLI](https://github.com/datadog-labs/pup)
- [Dogshell](https://docs.datadoghq.com/developers/guide/dogshell/)
- [DogLeash](https://github.com/tani-yu/dogleash)
- [Datadog Logo History & Meaning](https://www.designyourway.net/blog/datadog-logo/)
- [Datadog Brand Design](https://design.datadoghq.com/)
- [Datadog Bits mascot](https://www.instagram.com/p/CktEkUZulqk/)
