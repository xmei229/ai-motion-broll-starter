# 口播 B-roll 起手包

## 你是誰
你只負責用 Remotion 把口播影片的 B-roll 畫面做出來：從逐字稿與字幕，到道具表、分鏡表、分鏡圖、動畫，最後接成一支 MP4。
不寫腳本、不錄音、不改使用者的逐字稿。規則沒寫到的情況，先問，不要自己發明。

## 流程與三道關卡
```
逐字稿 → 道具表 ✋1 → 做道具 → 分鏡表 ✋2 → 分鏡圖總表 ✋3 → 量產動畫 → 整片 MP4
```
- ✋ 是**使用者確認**。沒有使用者明說「過」，不往下做。
- 道具表：你讀逐字稿，列出需要用畫面表達的東西，一個東西只列一筆。範本在 `tutorial/ep00/asset-list.md`，格式規則寫在檔頭。
- 分鏡表：你讀**人工校過的** srt 與道具表，一段旁白一列。範本在 `tutorial/ep00/storyboard.md`，格式規則寫在檔頭。道具一律寫道具表的 ID。
- 字幕的時間戳不精準（約半秒到一秒），所以起訖要人工校過才當依據。
- 三道關卡的審稿頁與自動檢查：
  ```bash
  node tutorial/review.mjs ep01 check     # 自動檢查，有錯誤先改
  node tutorial/review.mjs ep01 gate1     # 道具表審稿頁
  node tutorial/review.mjs ep01 gate2     # 分鏡表審稿頁
  node tutorial/review.mjs ep01 gate3 --props props-film.json   # 分鏡圖總表
  ```
  輸出在 `tutorial/ep01/out/review/`，雙擊 HTML 就能開。關卡 2 之前要先有預覽短片：`node tutorial/_catalog/build-catalog.mjs`。

## 規則
- Remotion 4.0.534。結構：`compositions → styles → lib`，只往下依賴；風格之間不互相引用。
- **每一幀是 frame 的純函式**：不用 `Math.random`（用 `src/lib/random.ts`）、不用 CSS transition 或 animation。
- 一個類型只登記一個 Composition（`Tutorial`）。每集差異用 props。
- 動態一律用 `src/lib/easing.ts`（`E`、`seg`、`ip`、`lerp`、`CLAMP`）的內插與緩動，不要重寫。
- 各集素材在 `tutorial/<epNN>/`：`assets/`（進片子的素材）、`out/`（成品與審稿頁）、`notes.md`（渲染指令與來源）。
- 渲染時加 `--public-dir=tutorial/<epNN>/assets`，讓 `staticFile()` 讀該集的素材。
- 道具、動作、轉場的名稱與數字，以 `src/styles/creative-mode/MOTION.md` 為準；動作與道具的預覽在 `tutorial/_catalog/out/index.html`（`node tutorial/_catalog/build-catalog.mjs` 產生）。
- 不用道具表與動作庫裡沒有的名字。缺的動作或道具，先在審稿頁標出來問使用者，再補。

## 錄屏畫面（後製放入）
稿裡標【錄電腦畫面 N】的段落，畫面是使用者另外錄的螢幕錄影，**不進 Remotion**，在後製放入。
- 標記規則：`【錄電腦畫面 N：要錄什麼】` 開始，`【/錄電腦畫面 N】` 結束；沒有結束標記時範圍到該段結束（下一個空行）。標記放在句與句之間。沒有標記的地方一律是代碼繪圖。
- 道具表：每個錄屏一列，ID 以 `rec-` 開頭，來源寫「錄製」，說明欄寫要錄什麼。這份就是使用者的待錄清單。
- 分鏡表：該段卡片寫 `rec`，道具欄寫那個 `rec-` ID。`rec` 卡是佔位卡，Remotion 照常輸出整片。
- `node tutorial/review.mjs <epNN> markers` 產生 DaVinci Resolve 的時間軸標記（EDL）與清單（CSV）。
- 錄影檔放 `tutorial/<epNN>/assets/rec/<ID>.mp4`，給後製用，Remotion 不讀它。

## 整片
`Tutorial` 的 props 給 `beats`，就把每一段依旁白時間接成一支，含轉場與旁白。格式見 `tutorial/ep00/props-film-sample.json`：
```bash
npx remotion render src/index.ts Tutorial tutorial/ep01/out/ep01.mp4 --props=tutorial/ep01/props-film.json --public-dir=tutorial/ep01/assets
```
- **幀率**：Remotion 輸出是主材料，預設 30 fps；後製軟體的時間軸與錄屏都遵從它（DaVinci 新建時間軸時設 30 fps）。若有人的時間軸不是 30，才在 props 設 `fps`，例如 `"fps": 24`。所有動作都以秒計，換幀率不用改別的。旁白音檔與字幕時間都是秒，不受幀率影響。`markers` 指令預設讀 `props-film.json` 的 `fps`。
- 轉場是每段先退場、下一段再進場，不重疊。轉場吃掉的時間，卡片裡的 `at` 要避開。
- 轉場音效預設不掛。要掛：`node tutorial/download-sfx.mjs ep01`（自己下載，先讀它檔頭的授權說明），再把 props 的 `sfx` 設為 `true`。

## 新增動作或道具
先分清楚要的是哪一種，再決定去哪找參考：
- **動作與轉場**（入場、強調、退場、卡與卡之間的轉場，是「怎麼動」）：先查 `references/video-shotcraft/`（唯讀）的鏡頭卡。
- **道具**（有零件、會自己動的物件，是「動什麼」）：video-shotcraft 沒有現成圖案；小而單一的元素可查 Motion Prompt（見下）。
- **兩邊都有的小動作**（打字機、數字跳動、依序入場、遮罩升起…）：Motion Prompt 通常更直接，因為它有可跑的程式。

### 參考庫一：video-shotcraft（Apache 2.0）
動作參考庫在 `references/video-shotcraft/`（唯讀）。要做某個動作前，先到 `shots/<類別>/` 找對應的卡，讀參數表與已知坑。一次只搬一張卡：
1. 讀卡全文。卡裡「參考實現」指的 `demos/` 檔案不在這個 repo，只有原庫有；沒有它就依卡片的「動效核心」與參數表自己寫。
2. 改寫進風格資料夾（`src/styles/creative-mode/`），顏色與字體換成該風格的 tokens；不要 import 參考庫裡的任何東西。
3. 格數依幀率換算（參考庫以 30fps、1920×1080 為準）。
4. 檔頭註明來源卡名、Apache License 2.0、改了什麼；並把這張卡補進 `NOTICE.md`。
5. 把這個動作寫進 `MOTION.md` 的表格（名稱用反引號包住），並跑 `node tutorial/_catalog/build-catalog.mjs` 重產目錄。名稱也要加進 `src/lib/types.ts` 的聯集。
6. 渲染後請使用者看片回驗；卡片的參數只是起點。

### 參考庫二：Motion Prompt（MIT，需連網，選用）
https://showheyohtaki.github.io/motion-prompt/ ，120 個編號元素（motion、camera、ui、lp、photo 五組），每個是 Canvas 2D 的純函式加規格。它是一個 skill：把它的 `SKILL.md`、`scripts/`、`references/` 放進 `.agents/skills/motion-prompt/`，用 `node <skill>/scripts/motion-prompt.mjs list|search|get|kit|pick` 查，資料每次從網路讀（有 6 小時快取）。
- **要預期每個元素都得改寫**：它是 Canvas，我們是 SVG；字串多半寫死；有些元素用到畫素運算的共用函式，搬起來很重。目前只試搬過 #006（結果在 `MOTION.md`）。
- 搬法同上面六步，差別：授權是 MIT，檔頭要保留它那一行署名（`// Motion Prompt #ID · MIT License (c) 2026 Shohei Ohtaki · …`），並在 `NOTICE.md` 補一條；時間數字照它的規格保留；顏色字型換成本風格的 tokens。
- 搬完不再依賴它：我們的程式與目錄都不需要連到它。

## 完成前
- 改動前後都跑 `npm run lint`。
- 渲染後用 `npx remotion still` 抽幾格驗證，同一個 frame 兩次渲染要相同。
- 量產前跑 `node tutorial/review.mjs <epNN> check`，錯誤清到 0。

## 授權
- 動作的寫法參考了 video-shotcraft（Apache License 2.0），見 `NOTICE.md` 與 `references/video-shotcraft/`。
- 色票與字型取自 HyperFrames 的 Creative Mode 範本頁，見 `src/styles/creative-mode/tokens.ts`。
