// 三道關卡的審稿頁與自動檢查。
// 用法（從專案根目錄）：
//   node tutorial/review.mjs <epNN> check                 只跑自動檢查，有錯誤就以非 0 結束
//   node tutorial/review.mjs <epNN> gate1                 關卡 1：道具表審稿頁
//   node tutorial/review.mjs <epNN> gate2                 關卡 2：分鏡表審稿頁（含自動檢查結果）
//   node tutorial/review.mjs <epNN> gate3 [--props 檔名]  關卡 3：分鏡圖總表（每段渲一張，排成一頁）
// 輸入：tutorial/<epNN>/asset-list.md、storyboard.md、props-film.json（關卡 3）
// 輸出：tutorial/<epNN>/out/review/*.html（資料與圖片都在同一個資料夾，搬走也能開）
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [ep, cmd, ...rest] = process.argv.slice(2);
if (!ep || !cmd) {
  console.error("用法：node tutorial/review.mjs <epNN> <check|gate1|gate2|gate3>");
  process.exit(1);
}
const ROOT = process.cwd();
const EP = path.join(ROOT, "tutorial", ep);
const REVIEW = path.join(EP, "out", "review");
const CATALOG_CLIPS = path.join(ROOT, "tutorial", "_catalog", "out", "clips");
const flag = (name) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};

// ---------- 讀程式裡的名單 ----------
const read = (p) => fs.readFileSync(p, "utf-8");
const types = read(path.join(ROOT, "src/lib/types.ts"));
const union = (name) => {
  const m = types.match(new RegExp(`export type ${name}\\s*=([^;]+);`));
  if (!m) throw new Error(`types.ts 找不到 ${name}`);
  return [...m[1].matchAll(/"([A-Za-z]+)"/g)].map((x) => x[1]);
};
const VOCAB = {
  enter: union("EnterAction"),
  emphasis: union("EmphasisAction"),
  exit: union("ExitAction"),
  transition: union("TransitionName").filter((n) => n !== "none"),
};
const CARD_KINDS = [...types.matchAll(/kind:\s*"(\w+)"/g)].map((m) => m[1]);
const REGISTERED = [
  ...read(path.join(ROOT, "src/styles/creative-mode/props/index.ts")).matchAll(/^\s+(\w+):\s*\w+,/gm),
].map((m) => m[1]);
const MEANINGS = ["比較", "步驟", "分類", "程度", "概念"];
const SOURCES = ["庫內已有", "需新做", "外部素材", "無法具象化"];

// ---------- Markdown 表格 ----------
const parseTable = (file, firstHeader) => {
  const lines = read(file).split("\n");
  const start = lines.findIndex((l) => l.startsWith(`| ${firstHeader} `) || l.startsWith(`| ${firstHeader}|`));
  if (start < 0) throw new Error(`${path.relative(ROOT, file)} 找不到表頭（第一欄要是 ${firstHeader}）`);
  const cells = (l) => l.split("|").slice(1, -1).map((c) => c.trim());
  const header = cells(lines[start]);
  const rows = [];
  for (let i = start + 2; i < lines.length && lines[i].startsWith("|"); i++) {
    const c = cells(lines[i]);
    rows.push(Object.fromEntries(header.map((h, k) => [h, c[k] ?? ""])));
  }
  return { header, rows };
};
const secOf = (s) => {
  const m = /^(\d+):(\d{2}(?:\.\d+)?)$/.exec(s);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};
const fmtSec = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, "0")}`;
const dash = (s) => (s === "—" || s === "" ? null : s);
const tokens = (s) => (dash(s) ? s.split(/[、,，]/).map((x) => x.trim()).filter(Boolean) : []);

const ASSET_HEAD = ["ID", "名稱", "用途（稿中原句）", "出現處", "次數", "來源", "零件", "動作", "備註"];
const BEAT_HEAD = ["Beat", "起", "訖", "旁白摘錄", "意思類型", "卡片", "道具", "畫面描述", "進場", "強調", "退場", "轉場", "備註"];

const loadAssets = () => parseTable(path.join(EP, "asset-list.md"), "ID");
const loadBeats = () => parseTable(path.join(EP, "storyboard.md"), "Beat");

// ---------- 自動檢查 ----------
const checkAssets = ({ header, rows }) => {
  const r = { errors: [], warns: [], infos: [] };
  if (header.join("|") !== ASSET_HEAD.join("|")) r.errors.push(`道具表表頭不對。要是：${ASSET_HEAD.join("、")}`);
  const seen = new Set();
  for (const a of rows) {
    if (!/^[a-z0-9-]+$/.test(a.ID)) r.errors.push(`道具 ID「${a.ID}」要用小寫英數字與連字號`);
    if (seen.has(a.ID)) r.errors.push(`道具 ID「${a.ID}」重複`);
    seen.add(a.ID);
    if (!SOURCES.includes(a["來源"])) r.errors.push(`道具 ${a.ID} 的來源「${a["來源"]}」不在 ${SOURCES.join("、")} 裡`);
    for (const t of a["動作"].split(/[；;]/).filter(Boolean)) {
      const name = t.split(/[:：]/)[1]?.trim();
      const known = [...VOCAB.enter, ...VOCAB.emphasis, ...VOCAB.exit];
      if (name && /^[A-Za-z]+$/.test(name) && !known.includes(name))
        r.warns.push(`道具 ${a.ID} 的動作「${name}」不在動作庫裡（要先做這個動作，或改用現有的）`);
    }
    if (a["來源"] === "庫內已有" && !REGISTERED.includes(a.ID)) r.errors.push(`道具 ${a.ID} 標「庫內已有」，但沒有在 props/index.ts 登記`);
    if (a["來源"] === "需新做" && !REGISTERED.includes(a.ID)) r.infos.push(`道具 ${a.ID} 還沒做（需新做）`);
  }
  return r;
};

const checkBeats = ({ header, rows }, assets) => {
  const r = { errors: [], warns: [], infos: [] };
  if (header.join("|") !== BEAT_HEAD.join("|")) r.errors.push(`分鏡表表頭不對。要是：${BEAT_HEAD.join("、")}`);
  const ids = new Set(assets.rows.map((a) => a.ID));
  const used = new Set();
  let prevEnd = 0;
  rows.forEach((b, i) => {
    const tag = `Beat ${b.Beat}`;
    const s = secOf(b["起"]);
    const e = secOf(b["訖"]);
    if (Number.isNaN(s) || Number.isNaN(e)) r.errors.push(`${tag} 的時間格式要是 mm:ss.s`);
    else {
      if (e <= s) r.errors.push(`${tag} 的訖要晚於起`);
      if (s < prevEnd - 0.05) r.errors.push(`${tag} 與前一段重疊（起 ${b["起"]} < 前段訖 ${fmtSec(prevEnd)}）`);
      else if (s > prevEnd + 0.05 && i > 0) r.warns.push(`${tag} 與前一段之間有 ${(s - prevEnd).toFixed(1)} 秒空檔（空檔會露出紙底，要有意為之）`);
      prevEnd = e;
    }
    if (Number(b.Beat) !== i + 1) r.warns.push(`Beat 編號不連號：第 ${i + 1} 列寫 ${b.Beat}`);
    if (!MEANINGS.includes(b["意思類型"])) r.errors.push(`${tag} 的意思類型「${b["意思類型"]}」不在 ${MEANINGS.join("、")} 裡`);
    if (!CARD_KINDS.includes(b["卡片"]) && !b["卡片"].startsWith("新增:")) r.errors.push(`${tag} 的卡片「${b["卡片"]}」不在 ${CARD_KINDS.join("、")} 裡`);
    if (b["卡片"].startsWith("新增:")) r.warns.push(`${tag} 需要還沒有的版型：${b["卡片"]}`);
    for (const id of tokens(b["道具"])) {
      used.add(id);
      if (!ids.has(id)) r.errors.push(`${tag} 用了道具表沒有的 ID「${id}」`);
    }
    for (const [col, list] of [["進場", VOCAB.enter], ["強調", VOCAB.emphasis], ["退場", VOCAB.exit]])
      for (const t of tokens(b[col])) if (!list.includes(t)) r.errors.push(`${tag} 的${col}「${t}」不在動作庫裡（${list.join("、")}）`);
    const tr = dash(b["轉場"]);
    if (tr && !VOCAB.transition.includes(tr)) r.errors.push(`${tag} 的轉場「${tr}」不在 ${VOCAB.transition.join("、")} 裡`);
    if (i === rows.length - 1 && tr) r.errors.push(`最後一個 Beat 的轉場要寫 —`);
    if (i < rows.length - 1 && !tr) r.warns.push(`${tag} 沒有轉場（會裸切）`);
    if (i > 0) {
      const p = rows[i - 1];
      if (tr && dash(p["轉場"]) === tr) r.errors.push(`Beat ${p.Beat} 與 ${b.Beat} 的轉場都是 ${tr}（連續兩個不能相同）`);
      if (i > 1) {
        const pp = rows[i - 2];
        const en = dash(b["進場"]);
        if (en && dash(p["進場"]) === en && dash(pp["進場"]) === en) r.errors.push(`Beat ${pp.Beat}、${p.Beat}、${b.Beat} 的進場都是 ${en}（連續三個不能相同）`);
      }
    }
    if (tr === "carry") r.infos.push(`${tag} 用 carry：下一段進場的線要接在同一個高度，props 裡 transitionAnchor 與 transitionAnchorIn 的 y 要一樣`);
  });
  const count = (n) => rows.filter((b) => dash(b["轉場"]) === n).length;
  if (count("iris") > 1) r.warns.push(`iris 用了 ${count("iris")} 次（建議全片只用一次）`);
  for (const n of ["blocks", "doors"]) if (count(n) > 3) r.warns.push(`${n} 用了 ${count(n)} 次（建議不超過 3 次）`);
  for (const a of assets.rows) if (!used.has(a.ID)) r.warns.push(`道具表的 ${a.ID} 沒有任何 Beat 用到`);
  if (rows.some((b) => b["備註"].includes("範例"))) r.infos.push("這份分鏡表含「範例」列，還是範本");
  return r;
};

const checkFilm = (film, beats, propsFile) => {
  const r = { errors: [], warns: [], infos: [] };
  const fb = film.beats ?? [];
  if (fb.length !== beats.rows.length) r.errors.push(`${propsFile} 有 ${fb.length} 段，分鏡表有 ${beats.rows.length} 個 Beat`);
  fb.forEach((b, i) => {
    const row = beats.rows[i];
    if (!row) return;
    const tag = `Beat ${row.Beat}`;
    const s = secOf(row["起"]);
    const e = secOf(row["訖"]);
    if (Math.abs(b.start - s) > 0.05) r.errors.push(`${tag} 的 start ${b.start} 與分鏡表 ${row["起"]} 對不上`);
    if (Math.abs(b.end - e) > 0.05) r.errors.push(`${tag} 的 end ${b.end} 與分鏡表 ${row["訖"]} 對不上`);
    if (b.card.kind !== row["卡片"] && !row["卡片"].startsWith("新增:")) r.errors.push(`${tag} 的卡片是 ${b.card.kind}，分鏡表寫 ${row["卡片"]}`);
    if ((b.transitionOut ?? "none") !== (dash(row["轉場"]) ?? "none")) r.errors.push(`${tag} 的 transitionOut 是 ${b.transitionOut ?? "none"}，分鏡表寫 ${row["轉場"]}`);
    if (b.card.kind === "stage") {
      const want = new Set(tokens(row["道具"]));
      for (const it of b.card.items) if (!want.has(it.prop)) r.errors.push(`${tag} 擺了道具 ${it.prop}，分鏡表的道具欄沒有`);
    }
  });
  const out = fb.findIndex((b, i) => b.transitionOut === "carry" && i < fb.length - 1);
  fb.forEach((b, i) => {
    if (b.transitionOut === "carry" && fb[i + 1]) {
      const y1 = b.transitionAnchor?.[1];
      const y2 = fb[i + 1].transitionAnchorIn?.[1] ?? fb[i + 1].transitionAnchor?.[1];
      if (y1 === undefined || y2 === undefined || Math.abs(y1 - y2) > 0.001) r.errors.push(`Beat ${b.id} 與下一段的 carry 線高度不一致（${y1} vs ${y2}）`);
    }
  });
  void out;
  const assetsDir = path.join(EP, "assets");
  if (film.audio && !fs.existsSync(path.join(assetsDir, film.audio))) r.errors.push(`旁白檔 ${film.audio} 不在 assets/`);
  if (film.sfx === true) {
    const sfxTable = read(path.join(ROOT, "src/styles/creative-mode/sfx.ts"));
    for (const m of sfxTable.matchAll(/"([a-z]+\/[\w-]+\.mp3)"/g))
      if (!fs.existsSync(path.join(assetsDir, "sfx", m[1]))) r.errors.push(`音效 ${m[1]} 不在 assets/sfx/（先跑 node tutorial/download-sfx.mjs ${ep}）`);
  }
  return r;
};

const merge = (...rs) => ({
  errors: rs.flatMap((r) => r.errors),
  warns: rs.flatMap((r) => r.warns),
  infos: rs.flatMap((r) => r.infos),
});
const printResult = (r) => {
  r.errors.forEach((m) => console.log(`錯誤  ${m}`));
  r.warns.forEach((m) => console.log(`提醒  ${m}`));
  r.infos.forEach((m) => console.log(`備註  ${m}`));
  console.log(`\n${r.errors.length} 個錯誤，${r.warns.length} 個提醒，${r.infos.length} 則備註`);
};

// ---------- HTML ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const CSS = `
  :root { --bg:#fff6e0; --ink:#141414; --muted:#5e5850; --card:#fff; --accent:#ff4fa3; --err:#d92d20; --warn:#b54708; --ok:#1a7f37; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1a1814; --ink:#f4efe4; --muted:#b9b1a2; --card:#26231d; --err:#ff8a80; --warn:#ffb74d; --ok:#7bd88f; } }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 "Noto Sans TC", system-ui, sans-serif; }
  main { max-width:1280px; margin:0 auto; padding:24px 16px 64px; }
  h1 { font-size:26px; margin:0 0 4px; } h2 { font-size:20px; margin:32px 0 8px; border-bottom:3px solid var(--ink); }
  .hint { color:var(--muted); margin:0 0 12px; font-size:14px; }
  .box { background:var(--card); border:3px solid var(--ink); box-shadow:5px 5px 0 var(--ink); padding:10px 14px; margin:12px 0; }
  .err { color:var(--err); } .warn { color:var(--warn); } .ok { color:var(--ok); } .muted { color:var(--muted); }
  ul { margin:4px 0; padding-left:20px; }
  table { border-collapse:collapse; width:100%; font-size:14px; background:var(--card); }
  th, td { border:2px solid var(--ink); padding:4px 8px; text-align:left; vertical-align:top; }
  th { background:var(--accent); color:#141414; position:sticky; top:0; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:18px; }
  article { background:var(--card); border:3px solid var(--ink); box-shadow:5px 5px 0 var(--ink); padding:10px; }
  article img, article video { width:100%; display:block; background:#000; }
  h3 { font-size:16px; margin:8px 0 2px; } p { margin:0 0 6px; font-size:14px; }
  code { background:rgba(127,127,127,.2); padding:0 4px; }
  .tag { display:inline-block; border:2px solid var(--ink); padding:0 6px; font-size:12px; margin-right:4px; background:var(--card); }
  .bar { display:flex; height:36px; border:3px solid var(--ink); background:var(--card); margin:8px 0; }
  .bar div { border-right:2px solid var(--ink); font-size:12px; text-align:center; overflow:hidden; line-height:30px; }
  .bar div:last-child { border-right:none; }
`;
const page = (title, body) => `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head>
<body><main>${body}</main></body></html>
`;
const resultBox = (r) => {
  const list = (cls, items, label) => (items.length ? `<p class="${cls}"><b>${label}（${items.length}）</b></p><ul>${items.map((m) => `<li class="${cls}">${esc(m)}</li>`).join("")}</ul>` : "");
  const ok = !r.errors.length && !r.warns.length;
  return `<div class="box"><b>自動檢查</b>${ok ? ' <span class="ok">全部通過</span>' : ""}${list("err", r.errors, "錯誤，過關卡前要改")}${list("warn", r.warns, "提醒，請你看一眼")}${list("muted", r.infos, "備註")}</div>`;
};
const copyClip = (name) => {
  const from = path.join(CATALOG_CLIPS, name);
  if (!fs.existsSync(from)) return null;
  fs.mkdirSync(path.join(REVIEW, "clips"), { recursive: true });
  fs.copyFileSync(from, path.join(REVIEW, "clips", name));
  return `clips/${name}`;
};
const clipCard = (name, title, text) => {
  const src = copyClip(name);
  return `<article>${src ? `<video src="${src}" muted loop playsinline controls preload="metadata"></video>` : '<p class="muted">（目錄裡還沒有這支預覽，先跑 node tutorial/_catalog/build-catalog.mjs）</p>'}<h3>${esc(title)}</h3><p>${esc(text)}</p></article>`;
};
const write = (name, html) => {
  fs.mkdirSync(REVIEW, { recursive: true });
  const f = path.join(REVIEW, name);
  fs.writeFileSync(f, html);
  console.log(`完成：${path.relative(ROOT, f)}`);
};

// ---------- 關卡 ----------
if (cmd === "check") {
  const assets = loadAssets();
  const beats = loadBeats();
  const parts = [checkAssets(assets), checkBeats(beats, assets)];
  const pf = flag("--props") ?? "props-film.json";
  const pp = path.join(EP, pf);
  if (fs.existsSync(pp)) parts.push(checkFilm(JSON.parse(read(pp)), beats, pf));
  const r = merge(...parts);
  printResult(r);
  process.exit(r.errors.length ? 1 : 0);
}

if (cmd === "gate1") {
  const assets = loadAssets();
  const r = checkAssets(assets);
  const bySrc = Object.fromEntries(SOURCES.map((s) => [s, assets.rows.filter((a) => a["來源"] === s).length]));
  const cards = assets.rows
    .map((a) => {
      const reg = REGISTERED.includes(a.ID);
      const clip = reg ? copyClip(`prop-${a.ID}.mp4`) : null;
      return `<article>${clip ? `<video src="${clip}" muted loop playsinline controls preload="metadata"></video>` : `<p class="muted">${reg ? "（目錄裡還沒有預覽）" : "還沒做，沒有預覽"}</p>`}
        <h3><code>${esc(a.ID)}</code> ${esc(a["名稱"])}</h3>
        <p><span class="tag">${esc(a["來源"])}</span><span class="tag">${esc(a["次數"])} 次</span><span class="tag">${esc(a["出現處"])}</span></p>
        <p><b>用途</b> ${esc(a["用途（稿中原句）"])}</p>
        <p><b>零件</b> ${esc(a["零件"])}</p><p><b>動作</b> ${esc(a["動作"])}</p>
        ${a["備註"] ? `<p class="muted">${esc(a["備註"])}</p>` : ""}</article>`;
    })
    .join("");
  write(
    "gate1-assets.html",
    page(
      "關卡 1：道具表",
      `<h1>關卡 1：道具表</h1><p class="hint">看四件事：有沒有漏掉你想要有畫面的東西；有沒有列了你不想要的；「外部素材」你能不能提供；「無法具象化」的建議你接不接受。</p>
      <div class="box">共 ${assets.rows.length} 項：${SOURCES.map((s) => `${s} ${bySrc[s]}`).join("，")}</div>
      ${resultBox(r)}<div class="grid">${cards}</div>`,
    ),
  );
}

if (cmd === "gate2") {
  const assets = loadAssets();
  const beats = loadBeats();
  const r = merge(checkAssets(assets), checkBeats(beats, assets));
  const spans = beats.rows.map((b) => ({ id: b.Beat, s: secOf(b["起"]), e: secOf(b["訖"]), kind: b["卡片"] }));
  const total = Math.max(1, ...spans.map((x) => x.e));
  const hue = (k) => ({ compare: "#ffe14d", chain: "#9fd0ff", branch: "#ffb3d9", tags: "#c9f0c9", bars: "#ffd2a8", stage: "#e0c8ff", icons: "#d8e8a0", picture: "#f0d0d0", meme: "#d0d0f0" })[k] ?? "#eee";
  const bar = `<div class="bar">${spans.map((x) => `<div style="flex:${Math.max(0.01, x.e - x.s)};background:${hue(x.kind)};color:#141414" title="Beat ${x.id} ${fmtSec(x.s)}–${fmtSec(x.e)} ${x.kind}">${x.id}</div>`).join("")}</div>`;
  const rows = beats.rows
    .map((b) => `<tr>${BEAT_HEAD.map((h) => `<td>${esc(b[h])}</td>`).join("")}</tr>`)
    .join("");
  const usedProps = [...new Set(beats.rows.flatMap((b) => tokens(b["道具"])))];
  const usedTr = [...new Set(beats.rows.map((b) => dash(b["轉場"])).filter(Boolean))];
  const usedAct = [...new Set(beats.rows.flatMap((b) => [...tokens(b["進場"]), ...tokens(b["強調"]), ...tokens(b["退場"])]))];
  const group = (a) => (VOCAB.enter.includes(a) ? "enter" : VOCAB.emphasis.includes(a) ? "emphasis" : "exit");
  const previews = [
    ...usedTr.map((t) => clipCard(`transition-${t}.mp4`, `轉場 ${t}`, "目錄裡的預覽")),
    ...usedAct.map((a) => clipCard(`${group(a)}-${a}.mp4`, `動作 ${a}`, "目錄裡的預覽")),
    ...usedProps.filter((p) => REGISTERED.includes(p)).map((p) => clipCard(`prop-${p}.mp4`, `道具 ${p}`, "目錄裡的預覽")),
  ].join("");
  write(
    "gate2-storyboard.html",
    page(
      "關卡 2：分鏡表",
      `<h1>關卡 2：分鏡表</h1><p class="hint">看三件事：每一段的卡片類型對不對；畫面比口白早或晚的時機；節奏有沒有哪裡單調。這一關還沒有真正的卡片畫面（要等你點頭、量產之後才有），下面附的是這張表用到的轉場、動作、道具的預覽。</p>
      ${resultBox(r)}
      <h2>節奏（寬度＝每段長度，顏色＝卡片類型）</h2>${bar}<p class="hint">總長 ${fmtSec(total)}，共 ${beats.rows.length} 段。</p>
      <h2>分鏡表</h2><div style="overflow-x:auto"><table><tr>${BEAT_HEAD.map((h) => `<th>${h}</th>`).join("")}</tr>${rows}</table></div>
      <h2>這張表用到的轉場、動作、道具</h2><div class="grid">${previews}</div>`,
    ),
  );
}

if (cmd === "gate3") {
  const pf = flag("--props") ?? "props-film.json";
  const pp = path.join(EP, pf);
  if (!fs.existsSync(pp)) throw new Error(`找不到 ${path.relative(ROOT, pp)}`);
  const film = JSON.parse(read(pp));
  const beats = fs.existsSync(path.join(EP, "storyboard.md")) ? loadBeats() : { rows: [] };
  const sb = Object.fromEntries(beats.rows.map((b) => [String(Number(b.Beat)), b]));
  const FPS = 30;
  const OUT_SEC = { dots: 0.26, push: 0.4, blocks: 0.55, doors: 0.45, iris: 0.45, carry: 0.9 };
  fs.mkdirSync(path.join(REVIEW, "stills"), { recursive: true });
  const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");
  const items = film.beats.map((b) => {
    // 停定那一格：退場開始前一點點；沒有退場就取結尾前 0.1 秒
    const hold = b.end - (OUT_SEC[b.transitionOut] ?? 0) - 0.05;
    const frame = Math.max(0, Math.round(Math.max(b.start + 0.05, hold) * FPS));
    const png = path.join(REVIEW, "stills", `beat-${b.id}.png`);
    console.log(`渲染 Beat ${b.id}（第 ${frame} 格）`);
    execSync(`npx remotion still src/index.ts Tutorial "${rel(png)}" --props="${rel(pp)}" --public-dir="${rel(path.join(EP, "assets"))}" --frame=${frame}`, { cwd: ROOT, stdio: "pipe" });
    return { b, row: sb[String(Number(b.id))], file: `stills/beat-${b.id}.png` };
  });
  // 連續三張以上同一種卡片，標出來
  const runs = [];
  for (let i = 0; i < items.length; ) {
    let j = i;
    while (j + 1 < items.length && items[j + 1].b.card.kind === items[i].b.card.kind) j++;
    if (j - i >= 2) runs.push(`Beat ${items[i].b.id} 到 ${items[j].b.id} 連續 ${j - i + 1} 張都是 ${items[i].b.card.kind}`);
    i = j + 1;
  }
  const r = { errors: [], warns: runs, infos: [] };
  const cards = items
    .map(({ b, row, file }) => `<article><img src="${file}" alt="Beat ${b.id}">
      <h3>Beat ${esc(b.id)} <small class="muted">${fmtSec(b.start)}–${fmtSec(b.end)}</small></h3>
      <p><span class="tag">${esc(b.card.kind)}</span>${b.transitionOut ? `<span class="tag">→ ${esc(b.transitionOut)}</span>` : ""}</p>
      <p>${esc(row?.["旁白摘錄"] ?? b.card.title ?? "")}</p></article>`)
    .join("");
  write(
    "gate3-contact-sheet.html",
    page(
      "關卡 3：分鏡圖總表",
      `<h1>關卡 3：分鏡圖總表</h1><p class="hint">每段停定的那一格，依序排開。看版面、字級、道具造型，哪裡太擠，哪裡連著好幾張長得一樣。靜止畫面看不出動作和轉場，這兩樣以分鏡表為準。</p>
      ${resultBox(r)}<div class="grid">${cards}</div>`,
    ),
  );
}
