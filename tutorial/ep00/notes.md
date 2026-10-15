# tutorial/ep00：範本

新的一集請複製這個資料夾（例如 `ep01`）：`asset-list.md`、`storyboard.md` 填你自己的內容，`assets/` 放旁白與字幕。

## 渲染範例
```bash
npx remotion render src/index.ts Tutorial tutorial/ep00/out/film-sample.mp4 --props=tutorial/ep00/props-film-sample.json --public-dir=tutorial/ep00/assets
```
這個樣片沒有旁白、沒有音效。
