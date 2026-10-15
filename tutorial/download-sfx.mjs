// 下載整片會用到的轉場音效到該集的 assets/sfx/。
// 用法（從專案根目錄）：node tutorial/download-sfx.mjs ep00
// 來源是 Mixkit 的免費音效（Mixkit Sound Effects Free License）。這支腳本由你自己執行，
// 下載前請先讀 https://mixkit.co/license/#sfxFree ；本專案不附音效檔，也不替你下載。
// 要掛哪些音效由 src/styles/creative-mode/sfx.ts 決定；換了對照表，這裡的 URL 表也要補。
import fs from "node:fs";
import path from "node:path";

const URLS = {
  "transition/swoosh-quick.mp3": "https://assets.mixkit.co/active_storage/sfx/166/166-preview.mp3",
  "transition/whoosh-fast.mp3": "https://assets.mixkit.co/active_storage/sfx/1490/1490-preview.mp3",
  "ui/switch-click-quick.mp3": "https://assets.mixkit.co/active_storage/sfx/2582/2582-preview.mp3",
  "mech/door-open-futuristic.mp3": "https://assets.mixkit.co/active_storage/sfx/183/183-preview.mp3",
  "transition/air-zoom-vacuum.mp3": "https://assets.mixkit.co/active_storage/sfx/2608/2608-preview.mp3",
  "text/marker-pen-line.mp3": "https://assets.mixkit.co/active_storage/sfx/2998/2998-preview.mp3",
};

const ep = process.argv[2];
if (!ep) {
  console.error("用法：node tutorial/download-sfx.mjs <epNN>");
  process.exit(1);
}
const ROOT = process.cwd();
const table = fs.readFileSync(path.join(ROOT, "src/styles/creative-mode/sfx.ts"), "utf-8");
const wanted = [...new Set([...table.matchAll(/"([a-z]+\/[\w-]+\.mp3)"/g)].map((m) => m[1]))];
for (const f of wanted) {
  const url = URLS[f];
  if (!url) throw new Error(`這支腳本的 URL 表沒有 ${f}，請補上來源網址`);
  const to = path.join(ROOT, "tutorial", ep, "assets", "sfx", f);
  if (fs.existsSync(to)) continue;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下載失敗 ${url}：${res.status}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, Buffer.from(await res.arrayBuffer()));
  console.log(`下載 ${f}`);
}
console.log(`完成：assets/sfx/ 已備齊。要掛音效，整片 props 設 "sfx": true。`);
