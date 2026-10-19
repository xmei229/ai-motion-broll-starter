# tutorial/ep00：範本

新的一集請複製這個資料夾（例如 `ep01`）：`asset-list.md`、`storyboard.md` 填你自己的內容，`assets/` 放旁白與字幕。

## 渲染範例
```bash
npx remotion render src/index.ts Tutorial tutorial/ep00/out/film-sample.mp4 --props=tutorial/ep00/props-film-sample.json --public-dir=tutorial/ep00/assets
```
這個樣片沒有旁白、沒有音效。

## 注意
`props-film-sample.json` 是獨立的渲染示範，跟這裡的範例分鏡表不是同一支片，所以拿它跑 `node tutorial/review.mjs ep00 check --props props-film-sample.json` 會報「對不上」。正式做一集時，分鏡表與整片 props 必須一致，`check` 要 0 個錯誤。
