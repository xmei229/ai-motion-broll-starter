# video-shotcraft 動作參考卡（唯讀副本）

- 來源：https://github.com/Vincentwei1021/video-shotcraft ，Apache License 2.0，全文見同層 `LICENSE`。
- 副本取自 commit `5ddbf521038b0a7accfb6dc1e0a9eb29c67277ab`（2026-09-28）。
- 複製了什麼：`shots/` 的 157 張鏡頭配方卡（分 10 類，.md 檔）、`shots/ATTRIBUTION.md`（各卡的研究來源與法律邊界說明）、`aesthetic-rules.md`（卡片裡的「R1」「Q4」等代號指這份）。
- 沒有複製：它的 `demos/`（參考實作程式與素材）、宣傳片模板、工作台、音訊。卡片裡的「參考實現」指向的 `demos/` 檔案不在這裡，要看請去原庫。
- 這個資料夾**唯讀**，不是程式的一部分，不被 `src/` 引用，也不受 lint 管。更新時整個資料夾換掉，並改上面的 commit 與日期。

## 看預覽
原作者的線上動作庫（有分類篩選與搜尋，每張卡有動作範例）：https://vincentwei1021.github.io/video-shotcraft/library.html
注意：那一頁標示 124 張卡，而這份副本有 157 張（副本取自較新的 commit），數量與內容不一定一一對得上，以副本為準。

## 用法
要新增一個動作（轉場、入場等）時，先到 `shots/<類別>/` 找對應的卡，讀參數表與已知坑，再照 `CLAUDE.md` 的「新增動作」步驟搬進風格。卡片的參數是在灰階示意素材上調的起點，不保證直接適合你的風格。
