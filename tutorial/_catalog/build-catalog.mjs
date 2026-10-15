// 動態目錄產生器：讀 Creative Mode 的動作與道具登記，逐項渲一支短片，再排成一頁 HTML。
// 名單來自程式本身（types.ts 的動作與轉場名稱、props/index.ts 的道具 ID），
// 說明文字來自 MOTION.md 的表格；任何一個名字在 MOTION.md 找不到說明就報錯，所以目錄不會和程式脫節。
//
// 用法（從專案根目錄）：
//   node tutorial/_catalog/build-catalog.mjs           只渲還沒有的短片，並重排 HTML
//   node tutorial/_catalog/build-catalog.mjs --force   全部重渲
//   node tutorial/_catalog/build-catalog.mjs --html    只重排 HTML，不渲染
// 輸出：tutorial/_catalog/out/index.html 與 tutorial/_catalog/out/clips/*.mp4
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HERE = path.join(ROOT, "tutorial", "_catalog");
const OUT = path.join(HERE, "out");
const CLIPS = path.join(OUT, "clips");
const PROPS_DIR = path.join(HERE, "props");
const args = new Set(process.argv.slice(2));

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const types = read("src/lib/types.ts");
const motion = read("src/styles/creative-mode/MOTION.md");
const propsIndex = read("src/styles/creative-mode/props/index.ts");

// ---- 從程式取名單 ----
const union = (name) => {
  const m = types.match(new RegExp(`export type ${name}\\s*=([^;]+);`));
  if (!m) throw new Error(`types.ts 找不到 ${name}`);
  return [...m[1].matchAll(/"([A-Za-z]+)"/g)].map((x) => x[1]);
};
const enters = union("EnterAction");
const emphases = union("EmphasisAction");
const exits = union("ExitAction");
const transitions = union("TransitionName").filter((n) => n !== "none");
const propIds = [...propsIndex.matchAll(/^\s+(\w+):\s*\w+,/gm)].map((m) => m[1]);

// ---- 從 MOTION.md 取說明：找「含 `name` 的表格列」，回傳該列的各格 ----
const rowCells = (name) => {
  for (const line of motion.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.some((c) => c === `\`${name}\``)) return cells;
  }
  throw new Error(`MOTION.md 找不到 ${name} 的說明列`);
};

// ---- 每一項的預覽片設定 ----
const bars = (title, labels) => ({
  kind: "bars",
  title,
  rows: [
    { label: labels[0], value: 0.8, rank: "高", at: 0.4, tone: "accent" },
    { label: labels[1], value: 0.5, rank: "中", at: 0.8 },
    { label: labels[2], value: 0.25, rank: "低", at: 1.2, tone: "warn" },
  ],
});
const base = { style: "creative-mode", aspect: "16:9" };
const tag = (text) => ({
  text,
  at: 0.1,
  x: 960,
  y: 930,
  tone: "yellow",
  display: true,
  size: 72,
});

const entries = [];

for (const t of transitions) {
  const anchorOut = t === "carry" ? [0.62, 0.5] : [0.5, 0.5];
  const anchorIn = t === "carry" ? [0.08, 0.5] : [0.5, 0.5];
  const row = rowCells(t);
  entries.push({
    group: "transition",
    id: t,
    desc: row[row.length - 1],
    label: row[0],
    sec: `出 ${row[3]} 秒／進 ${row[4]} 秒`,
    parts: [
      { ...base, card: bars(`轉場：${t}（出）`, ["第一條", "第二條", "第三條"]), durationSec: 3.5, transitionIn: "none", transitionOut: t, transitionAnchor: anchorOut },
      { ...base, card: bars(`轉場：${t}（進）`, ["甲", "乙", "丙"]), durationSec: 3.5, transitionIn: t, transitionOut: "none", transitionAnchor: anchorIn },
    ],
    usage: { transitionOut: t, transitionIn: t },
  });
}

const demoMic = (extra) => ({
  prop: "mic",
  x: 0.5,
  y: 0.52,
  size: 420,
  ...extra,
});
const stage = (title, item, tagText, durationSec) => ({
  ...base,
  card: { kind: "stage", title, items: [item], stickers: [tag(tagText)] },
  durationSec,
  transitionIn: "none",
  transitionOut: "none",
});

for (const a of enters) {
  const row = rowCells(a);
  entries.push({
    group: "enter",
    id: a,
    desc: row[row.length - 1],
    label: "進場",
    sec: `${row[2]} 秒`,
    parts: [stage(`道具動作：${a}`, demoMic({ at: 0.5, enter: a }), a, 2.4)],
    usage: { enter: a },
  });
}
for (const a of emphases) {
  const row = rowCells(a);
  entries.push({
    group: "emphasis",
    id: a,
    desc: row[row.length - 1],
    label: "強調",
    sec: `${row[2]} 秒`,
    parts: [stage(`道具動作：${a}`, demoMic({ at: 0.2, enter: "pop", emphasis: [{ at: 1.0, action: a }] }), a, 2.4)],
    usage: { emphasis: [{ at: 1.0, action: a }] },
  });
}
for (const a of exits) {
  const row = rowCells(a);
  entries.push({
    group: "exit",
    id: a,
    desc: row[row.length - 1],
    label: "退場",
    sec: `${row[2]} 秒`,
    parts: [stage(`道具動作：${a}`, demoMic({ at: 0.2, enter: "pop", exit: { at: 1.2, action: a } }), a, 2.2)],
    usage: { exit: { at: 1.2, action: a } },
  });
}
for (const id of propIds) {
  const row = rowCells(id);
  entries.push({
    group: "prop",
    id,
    desc: `零件：${row[2]}。持續動畫：${row[3]}。參數：${row[4]}。`,
    label: row[1],
    sec: "",
    parts: [
      stage(`道具：${id}`, { prop: id, x: 0.5, y: 0.52, size: 480, at: 0.3, enter: "pop" }, id, 4.5),
    ],
    usage: { prop: id },
  });
}

// ---- 渲染 ----
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: "pipe" });
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

if (!args.has("--html")) {
  fs.mkdirSync(CLIPS, { recursive: true });
  fs.mkdirSync(PROPS_DIR, { recursive: true });
  for (const e of entries) {
    const final = path.join(CLIPS, `${e.group}-${e.id}.mp4`);
    if (fs.existsSync(final) && !args.has("--force")) continue;
    const partFiles = [];
    e.parts.forEach((props, i) => {
      const pj = path.join(PROPS_DIR, `${e.group}-${e.id}-${i}.json`);
      fs.writeFileSync(pj, JSON.stringify(props, null, 2));
      const mp4 = path.join(CLIPS, `_${e.group}-${e.id}-${i}.mp4`);
      console.log(`渲染 ${rel(mp4)}`);
      sh(`npx remotion render src/index.ts Tutorial "${rel(mp4)}" --props="${rel(pj)}"`);
      partFiles.push(mp4);
    });
    if (partFiles.length === 1) {
      fs.renameSync(partFiles[0], final);
    } else {
      const list = path.join(CLIPS, `_${e.group}-${e.id}.txt`);
      fs.writeFileSync(list, partFiles.map((f) => `file '${path.basename(f)}'`).join("\n"));
      sh(`npx remotion ffmpeg -y -f concat -safe 0 -i "${rel(list)}" -c copy "${rel(final)}"`);
      [...partFiles, list].forEach((f) => fs.unlinkSync(f));
    }
  }
}

// ---- HTML ----
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const groups = [
  ["transition", "轉場（卡片與卡片之間）", "用法：`transitionIn`、`transitionOut`，必要時加 `transitionAnchor`。"],
  ["enter", "道具進場", "用法：`stage` 卡裡每個道具的 `enter`。"],
  ["emphasis", "道具強調", "用法：`stage` 卡裡每個道具的 `emphasis` 陣列。"],
  ["exit", "道具退場", "用法：`stage` 卡裡每個道具的 `exit`。"],
  ["prop", "道具", "用法：`stage` 卡裡的 `prop` 填這裡的 ID。"],
];
const card = (e) => `
    <article>
      <video src="clips/${e.group}-${e.id}.mp4" muted loop playsinline controls preload="metadata"></video>
      <h3><code>${esc(e.id)}</code> ${esc(e.label)}${e.sec ? ` <small>${esc(e.sec)}</small>` : ""}</h3>
      <p>${esc(e.desc)}</p>
      <pre>${esc(JSON.stringify(e.usage))}</pre>
    </article>`;
const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Creative Mode 動態目錄</title>
<style>
  :root { --bg:#fff6e0; --ink:#141414; --muted:#5e5850; --card:#fff; --accent:#ff4fa3; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1a1814; --ink:#f4efe4; --muted:#b9b1a2; --card:#26231d; } }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 "Noto Sans TC", system-ui, sans-serif; }
  main { max-width:1200px; margin:0 auto; padding:32px 16px 64px; }
  h1 { font-size:28px; margin:0 0 4px; }
  h2 { font-size:22px; margin:40px 0 4px; border-bottom:3px solid var(--ink); padding-bottom:4px; }
  .hint { color:var(--muted); margin:0 0 16px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:20px; }
  article { background:var(--card); border:3px solid var(--ink); box-shadow:6px 6px 0 var(--ink); padding:12px; }
  video { width:100%; display:block; background:#000; }
  h3 { font-size:17px; margin:10px 0 4px; }
  small { color:var(--muted); font-weight:400; }
  p { margin:0 0 8px; font-size:14px; }
  pre { margin:0; font-size:12px; white-space:pre-wrap; word-break:break-all; background:rgba(127,127,127,.15); padding:6px; }
  code { background:var(--accent); color:#141414; padding:0 6px; }
</style>
</head>
<body>
<main>
  <h1>Creative Mode 動態目錄</h1>
  <p class="hint">由程式產生，名單取自程式的登記，說明取自 <code>src/styles/creative-mode/MOTION.md</code>。數字都是第一版起點。每支短片可播放、可拖時間軸。</p>
${groups
  .map(
    ([g, title, hint]) => `  <h2>${title}</h2>
  <p class="hint">${esc(hint).replace(/`([^`]+)`/g, "<code>$1</code>")}</p>
  <div class="grid">${entries.filter((e) => e.group === g).map(card).join("")}
  </div>`,
  )
  .join("\n")}
</main>
</body>
</html>
`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log(`完成：${entries.length} 項，${rel(path.join(OUT, "index.html"))}`);
