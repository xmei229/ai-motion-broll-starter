// 輸入框：文字一個字一個字打進去，打完送出鈕亮起、按下、文字往上淡出。
// 來源：Motion Prompt #006 Typewriter（MIT License (c) 2026 Shohei Ohtaki，
// https://showheyohtaki.github.io/motion-prompt/#006）。這份是改寫，不是原程式：
//   - 原件是 539×208 的 Canvas，字串寫死是日文；這裡改成 SVG，文字由 StageItem 的 text 給。
//   - 時間數字照原件的規格保留：每字間隔 0.24 秒、從 0.3 秒開始；新字從 1.35 倍落回 1，
//     係數 1 + 0.35·e^(−16t)；游標打字時恆亮、等待時 0.94 秒週期閃（亮 0.5 秒）；
//     送出鈕彈簧 1 − e^(−6.5t)·cos(15t)；按下縮小 20%（半個正弦）；文字上移並淡出。
//   - 位移 70 px 在 539 px 寬的卡上，這裡換算成 viewBox 的 13 個單位。
//   - 顏色與字型換成這個風格的 tokens；原件的藍底、珊瑚色游標不用。
//   - 原件每 4.7 秒循環，這裡只跑一遍，之後停在「送出後」的空框。
//   - 字寬不用 measureText（要等字型載入、不同機器可能有差），改成查表估計，見下面的 em()。
// options：
//   startSec  第一個字出現的秒數，預設 0.3
//   charSec   每個字的間隔，預設 0.24
//   send      1 = 打完按送出並清空（預設），0 = 打完就停在那裡、不送出
import { COLORS, FONT_CJK } from "../tokens";
import type { PropDef, PropDrawProps } from "./types";

const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));
const P = (t: number, a: number, b: number): number => clamp((t - a) / (b - a));
const spring = (t: number, w: number, d: number): number =>
  t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);
const wide = (ch: string): boolean => /[⺀-鿿＀-￯]/.test(ch);
// 字寬估計（單位 em），不量字型：全形字 1，細字母 0.36，t f r j 0.42，寬字母 0.9，空白 0.3，大寫 0.68，其他 0.6。
// 這是對 Noto Sans TC 粗體拉丁字母的粗估，短句與指令夠用；要逐字精準請改成量字型。
const THIN = "il.,:;'!|()[]";
const MID = "tfrj";
const WIDE_LATIN = "mwMW@";
const em = (ch: string): number => {
  if (wide(ch)) return 1;
  if (ch === " ") return 0.3;
  if (THIN.includes(ch)) return 0.36;
  if (MID.includes(ch)) return 0.42;
  if (WIDE_LATIN.includes(ch)) return 0.9;
  if (/[A-Z]/.test(ch)) return 0.68;
  return 0.6;
};

const BX = 4;
const BY = 33;
const BW = 92;
const BH = 34;
const TEXT_X = BX + 5;
const TEXT_W = BW - 5 - 26; // 右邊留給送出鈕
const LIFT = 13; // 原件 70 px ÷ 539 px × 100

const Draw: React.FC<PropDrawProps> = ({ t, sw, fill, options, text }) => {
  const chars = [...(text ?? "輸入文字")];
  const n = chars.length;
  const t0 = options.startSec ?? 0.3;
  const dt = options.charSec ?? 0.24;
  const send = (options.send ?? 1) !== 0;

  const done = t0 + n * dt;
  const sendT = done + 0.55;
  const clr = send ? P(t, sendT + 0.12, sendT + 0.4) : 0;
  const on = send
    ? spring(t - done - 0.12, 15, 6.5) * (1 - P(t, sendT + 0.5, sendT + 0.8))
    : 0;
  const press = send ? 1 - 0.2 * Math.sin(Math.PI * P(t, sendT - 0.05, sendT + 0.2)) : 1;

  const totalEm = chars.reduce((a, c) => a + em(c), 0);
  const fs = Math.min(13, TEXT_W / Math.max(1, totalEm));
  const cy = BY + BH / 2;
  const shown = t < t0 ? 0 : clamp(Math.floor((t - t0) / dt) + 1, 0, n);

  let x = TEXT_X;
  const glyphs = chars.slice(0, shown).map((ch, i) => {
    const w = fs * em(ch);
    const age = t - (t0 + i * dt);
    const pop = 1 + 0.35 * Math.exp(-age * 16);
    const g = { ch, cx: x + w / 2, pop };
    x += w;
    return g;
  });
  const caretX = clr > 0.5 ? TEXT_X : x;
  const typing = t >= t0 - 0.05 && t < done + 0.1;
  const blink = typing ? true : t % 0.94 < 0.5;

  const bx = BX + BW - 12;
  const by = cy;
  const r = 9;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <rect
        x={BX}
        y={BY}
        width={BW}
        height={BH}
        rx={12}
        fill={COLORS.surface}
        stroke={COLORS.ink}
        strokeWidth={sw}
      />
      {glyphs.map((g, i) => (
        <g
          key={i}
          transform={`translate(${g.cx} ${cy - clr * LIFT}) scale(${g.pop})`}
          opacity={1 - clr}
        >
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT_CJK}
            fontWeight={900}
            fontSize={fs}
            fill={COLORS.ink}
          >
            {g.ch}
          </text>
        </g>
      ))}
      {blink ? (
        <rect
          x={caretX + 0.5}
          y={cy - fs * 0.65}
          width={1.2}
          height={fs * 1.3}
          rx={0.6}
          fill={COLORS.accent}
        />
      ) : null}
      <circle cx={bx} cy={by} r={r} fill="#DDD6C3" />
      {on > 0.01 ? (
        <circle
          cx={bx}
          cy={by}
          r={r * Math.min(on, 1.25) * press}
          fill={fill}
          stroke={COLORS.ink}
          strokeWidth={sw * 0.6}
        />
      ) : null}
      <path
        d={`M${bx} ${by + 3.6} L${bx} ${by - 3.6} M${bx - 3.3} ${by - 0.6} L${bx} ${by - 3.9} L${bx + 3.3} ${by - 0.6}`}
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={sw * 0.8}
      />
    </g>
  );
};

export const TypeBox: PropDef = {
  name: "輸入框",
  parts: ["輸入框", "文字", "游標", "送出鈕"],
  tones: ["yellow", "accent", "blue"],
  options: {
    startSec: "第一個字出現的秒數，預設 0.3",
    charSec: "每個字的間隔秒數，預設 0.24",
    send: "1 = 打完按送出並清空（預設）；0 = 打完停住",
  },
  needsText: true,
  continuous: "游標：打字時恆亮，等待時每 0.94 秒閃一次（亮 0.5 秒）",
  draw: Draw,
};
