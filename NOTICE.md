# NOTICE

## video-shotcraft
`src/styles/creative-mode/transitions.tsx` 與 `src/styles/creative-mode/props/actions.ts` 的動作寫法，參考了 video-shotcraft 的鏡頭卡（Apache License 2.0）。
- 來源：https://github.com/Vincentwei1021/video-shotcraft （參考的版本：commit `5ddbf521038b0a7accfb6dc1e0a9eb29c67277ab`，2026-09-28）
- 授權全文：`references/video-shotcraft/LICENSE`
- 改動：程式從零改寫成本專案的 TypeScript 與 tokens，沒有直接複製原檔；各檔檔頭註明參考的卡名與改了什麼。
- `src/lib/easing.ts` 的緩動表改寫自 video-shotcraft 的 `demos/_fixtures/Motion.tsx`，檔頭有說明。

## HyperFrames Creative Mode
`src/styles/creative-mode/tokens.ts` 的色票與字型取自 HyperFrames 的 Creative Mode 範本頁（https://www.hyperframes.dev/design/creative-mode）。HyperFrames 的 README 標示 Apache 2.0。

## 音效
本專案不附任何音效檔。`tutorial/download-sfx.mjs` 會從 Mixkit 下載，由使用者自己執行，授權見 https://mixkit.co/license/#sfxFree 。

## references/video-shotcraft/
這個資料夾是 video-shotcraft 的 157 張鏡頭配方卡與 `aesthetic-rules.md` 的**原樣副本**（Apache License 2.0，授權全文在同一資料夾的 `LICENSE`，來源與 commit 見 `SOURCE.md`）。這些檔案不是本專案作者寫的，也沒有修改；它們只供 agent 讀，不是程式的一部分。
