---
title: シェル補完
description: bee のタブ補完をセットアップする
---

bee はシェルのタブ補完をサポートしています。コマンド名やフラグ名を途中まで入力して Tab キーを押すと、候補が自動補完されます。

## セットアップ

### Bash

```sh
echo 'eval "$(bee completion bash)"' >> ~/.bashrc
source ~/.bashrc
```

### Zsh

```sh
echo 'eval "$(bee completion zsh)"' >> ~/.zshrc
source ~/.zshrc
```

### Fish

```sh
bee completion fish > ~/.config/fish/completions/bee.fish
```

## 確認

セットアップ後、`bee` と入力して Tab キーを押すと、利用可能なコマンドの一覧が表示されます。

```sh
bee <Tab>
# auth  issue  pr  repo  user  project  ...
```
