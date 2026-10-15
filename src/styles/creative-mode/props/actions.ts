// 道具動作庫：入場、強調、退場。全部是「從動作開始起算的秒數」的純函式，沒有隨機、沒有 CSS 動畫。
// 位移 x、y 的單位是「道具邊長的倍數」，這樣道具放大縮小時動作跟著比例走。
// pop、slam 沿用 ../motion.ts；其餘是 這個風格自己的，數字是第一版的起點，待使用者看片回驗。
// 語法參考 video-shotcraft 的進場鏡頭卡（Apache License 2.0，commit 5ddbf52）：
// 過衝、回彈、壓扁；沒有直接搬任何一張卡的程式。
import { E, ip, seg } from "../../../lib/easing";
import type {
  EmphasisAction,
  EnterAction,
  ExitAction,
} from "../../../lib/types";
import { pop, slam } from "../motion";

// 一個動作算出來的變形。o 是不透明度。
export type Xf = { x: number; y: number; sx: number; sy: number; rot: number; o: number };

export const IDENTITY: Xf = { x: 0, y: 0, sx: 1, sy: 1, rot: 0, o: 1 };

// 兩個變形疊在一起：位移與旋轉相加，縮放與不透明度相乘。
export const compose = (a: Xf, b: Xf): Xf => ({
  x: a.x + b.x,
  y: a.y + b.y,
  sx: a.sx * b.sx,
  sy: a.sy * b.sy,
  rot: a.rot + b.rot,
  o: a.o * b.o,
});

const scaled = (s: number): Xf => ({ ...IDENTITY, sx: s, sy: s });

export const ENTER_SEC: Record<EnterAction, number> = {
  pop: 0.2,
  slam: 0.3,
  spinIn: 0.5,
  dropIn: 0.46,
  slideIn: 0.4,
};
export const EMPHASIS_SEC: Record<EmphasisAction, number> = {
  wobble: 0.8,
  pulse: 0.3,
  jump: 0.4,
  shake: 0.5,
};
export const EXIT_SEC: Record<ExitAction, number> = {
  popOut: 0.25,
  slideOut: 0.4,
  spinOut: 0.4,
};

// t 是從進場那一刻起算的秒數；t < 0 時呼叫端自己不畫。
export const enterXf = (
  action: EnterAction,
  t: number,
  from: "left" | "right" = "right",
): Xf => {
  switch (action) {
    case "pop":
      return scaled(pop(t));
    case "slam": {
      const k = slam(t);
      return { ...IDENTITY, sx: k.x, sy: k.y };
    }
    case "spinIn": {
      // 邊轉邊放大，縮放過衝約 10% 再回 1；旋轉從 -360° 減速落到 0
      const p = seg(t, 0, ENTER_SEC.spinIn);
      const s = Math.max(0, E.outBack(p));
      return { ...IDENTITY, sx: s, sy: s, rot: -360 * (1 - E.outCubic(p)) };
    }
    case "dropIn": {
      // 從上方 3 倍邊長落下，落地彈起一點再停；落地瞬間壓扁
      let y: number;
      if (t < 0.26) y = -3 * (1 - E.inQuad(t / 0.26));
      else if (t < 0.36) y = -0.18 * E.outQuad((t - 0.26) / 0.1);
      else if (t < 0.46) y = -0.18 * (1 - E.inQuad((t - 0.36) / 0.1));
      else y = 0;
      const sy = t < 0.26 ? 1 : ip(t, [0.26, 0.3, 0.4], [0.85, 1.05, 1]);
      return { ...IDENTITY, y, sy };
    }
    case "slideIn": {
      const dir = from === "right" ? 1 : -1;
      return {
        ...IDENTITY,
        x: dir * 4 * (1 - E.outCubic(seg(t, 0, ENTER_SEC.slideIn))),
      };
    }
  }
};

// t 是從這個強調開始起算的秒數；還沒開始或結束後都是 IDENTITY。
export const emphasisXf = (action: EmphasisAction, t: number): Xf => {
  if (t < 0 || t >= EMPHASIS_SEC[action]) return IDENTITY;
  switch (action) {
    case "wobble":
      // 阻尼擺動：起始 ±12°，約 0.6 秒衰減掉
      return { ...IDENTITY, rot: 12 * Math.exp(-t * 5) * Math.sin(t * 38) };
    case "pulse":
      return scaled(1 + 0.15 * Math.sin(Math.PI * seg(t, 0, EMPHASIS_SEC.pulse)));
    case "jump": {
      const u = seg(t, 0, EMPHASIS_SEC.jump);
      return { ...IDENTITY, y: -0.3 * 4 * u * (1 - u) };
    }
    case "shake":
      // 水平抖動，振幅約 4% 邊長並衰減；300 px 的道具約 12 px，在 震動上限 14 px 內
      return { ...IDENTITY, x: 0.04 * Math.exp(-t * 7) * Math.sin(t * 80) };
  }
};

// t 是從退場開始起算的秒數。t 超過 EXIT_SEC 時呼叫端不畫。
export const exitXf = (action: ExitAction, t: number): Xf => {
  if (t < 0) return IDENTITY;
  switch (action) {
    case "popOut":
      return scaled(ip(t, [0, 0.08, EXIT_SEC.popOut], [1, 1.1, 0]));
    case "slideOut":
      return { ...IDENTITY, x: -4 * E.inCubic(seg(t, 0, EXIT_SEC.slideOut)) };
    case "spinOut": {
      const p = E.inCubic(seg(t, 0, EXIT_SEC.spinOut));
      return { ...IDENTITY, sx: 1 - p, sy: 1 - p, rot: -360 * p };
    }
  }
};
