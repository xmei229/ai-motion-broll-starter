# 口播 B-roll 起手包

用 Remotion 做口播影片的 B-roll：逐字稿 → 道具表 → 分鏡表 → 分鏡圖 → 動畫 → 整片。

## 開始
```bash
git clone <這個 repo 的網址>
cd ai-motion-broll-starter
npm install
npm run dev        # 開 Remotion Studio
```
第一次渲染或開 Studio 時，Remotion 會自動下載一個約 280 MB 的無頭瀏覽器，放在 `node_modules/.remotion`；渲染時也要連網載入 Google Fonts。

然後把這個資料夾交給你的 agent（Claude Code、Codex、Gemini CLI 等），第一句話說：**請先讀 CLAUDE.md**。

## 你需要有
- Node.js（建議 22；我用 v22 測過，更舊的版本沒驗證）
- Git
- 一個能讀寫檔案、跑指令的 agent
- 你自己的逐字稿、旁白錄音、人工校過的 srt 字幕（放進 `tutorial/<epNN>/assets/`）

## 看範本
- `tutorial/ep00/asset-list.md`：道具表
- `tutorial/ep00/storyboard.md`：分鏡表
- `tutorial/ep00/props-film-sample.json`：整片 props 範例
- `references/video-shotcraft/`：157 張動作參考卡（唯讀、Apache 2.0），新增動作時給 agent 讀
- 動作與道具的預覽：`node tutorial/_catalog/build-catalog.mjs`，再開 `tutorial/_catalog/out/index.html`

## 授權
- Remotion 對公司有授權條件，請先讀 https://www.remotion.dev/docs/license 。
- 第三方來源見 `NOTICE.md`。
- 這個起手包的程式碼用 MIT 授權，見 `LICENSE`。

## 關於維護
這是方便想自己搭建的人用的個人起手包，**不保證回覆 issue 或 PR，也不保證持續更新**。有問題請先讀 `CLAUDE.md` 與 `MOTION.md`，或請你的 agent 讀。
