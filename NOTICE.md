# NOTICE

## video-shotcraft
`src/styles/creative-mode/transitions.tsx` 與 `src/styles/creative-mode/props/actions.ts` 的動作寫法，參考了 video-shotcraft 的鏡頭卡（Apache License 2.0）。
- 來源：https://github.com/Vincentwei1021/video-shotcraft （線上動作庫：https://vincentwei1021.github.io/video-shotcraft/library.html） （參考的版本：commit `5ddbf521038b0a7accfb6dc1e0a9eb29c67277ab`，2026-09-28）
- 授權全文：`references/video-shotcraft/LICENSE`
- 參考了哪幾張卡（卡名是 `references/video-shotcraft/shots/` 裡的檔名；線上動作庫有中英文介面，中文名在括號）：

  | 本專案的轉場 | 參考的卡 | 主要改動 |
  |---|---|---|
  | `push` 橫推 | `bottom-push-stack-wipe`（底邊上推換章） | 改成往左；去掉接縫陰影；出場與進場分開用兩條曲線 |
  | `blocks` 色塊階梯 | `color-block-step-wipe`（色塊階躍吞屏） | 保留零緩動；改成一整條色塊；徽章過衝與攜帶卡沒搬 |
  | `doors` 對開門 | `page-turn-transitions`（對開門那式） | 改成兩扇門蓋上，不是把舊頁裂成兩半；立方體翻轉沒搬 |
  | `iris` 光圈 | `circle-match-iris`（圓心匹配光圈切） | 只取光圈機制，沒有圓對圓的匹配 |
  | `carry` 延伸 | `line-carry-transition`（線條接力轉場） | 改成一條水平線；直角拐彎與圍框沒做；線頭停在畫面 78% 取自原卡 |

- 改動：程式從零改寫成本專案的 TypeScript 與 tokens，沒有直接複製原檔；各檔檔頭註明參考的卡名與改了什麼。
- `src/lib/easing.ts` 的緩動表改寫自 video-shotcraft 的 `demos/_fixtures/Motion.tsx`，檔頭有說明。

## HyperFrames Creative Mode
`src/styles/creative-mode/tokens.ts` 的色票與字型取自 HyperFrames 的 Creative Mode 範本頁（https://www.hyperframes.dev/design/creative-mode）。HyperFrames 的 README 標示 Apache 2.0。

## 音效
本專案不附任何音效檔。`tutorial/download-sfx.mjs` 會從 Mixkit 下載，由使用者自己執行，授權見 https://mixkit.co/license/#sfxFree 。

## references/video-shotcraft/
這個資料夾是 video-shotcraft 的 157 張鏡頭配方卡與 `aesthetic-rules.md` 的**原樣副本**（Apache License 2.0，授權全文在同一資料夾的 `LICENSE`，來源與 commit 見 `SOURCE.md`）。這些檔案不是本專案作者寫的，也沒有修改；它們只供 agent 讀，不是程式的一部分。

## Motion Prompt
`src/styles/creative-mode/props/TypeBox.tsx`（道具 `typebox`）改寫自 Motion Prompt #006 Typewriter（MIT License，Copyright (c) 2026 Shohei Ohtaki，https://showheyohtaki.github.io/motion-prompt/#006 ）。授權全文：`licenses/motion-prompt-LICENSE-MIT.txt`。
- 改動：Canvas 改成 SVG；字串由 props 給；顏色字型換成本專案的 tokens；字寬改查表估計；只跑一遍不循環。時間數字照原件規格保留。檔頭保留署名並寫明改了什麼。
- 之後從 Motion Prompt 搬用的元素，照同樣做法：保留檔頭署名、在這裡補一條。
