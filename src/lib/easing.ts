// 共用的緩動與內插。所有函式都是純函式，只依賴傳入的時間，符合「每一幀是 frame 的純函式」。
//
// 緩動表 E、seg、lerp 改寫自 video-shotcraft 的 demos/_fixtures/Motion.tsx
// （Apache License 2.0，commit 5ddbf52，2026-09-28）。改動：
//   - 轉成本專案的 TypeScript 寫法，拿掉 React 元件與它自己的伪隨機（本專案用 lib/random.ts）。
//   - cubic 三條改用連乘寫法，運算順序與 Remotion 的 Easing.cubic 相同，
//     讓原本用 Remotion Easing 的風格換過來之後輸出逐位不變。
// 名稱沿用 video-shotcraft 鏡頭卡的用語（outCubic、outBack、outExpo…），讀卡時可以直接對上。
import { interpolate } from "remotion";

export type Ease = (t: number) => number;

const cube = (x: number): number => x * x * x;

export const E = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => cube(t),
  outCubic: (t: number) => 1 - cube(1 - t),
  inOutCubic: (t: number) =>
    t < 0.5 ? cube(t * 2) / 2 : 1 - cube((1 - t) * 2) / 2,
  inQuart: (t: number) => t * t * t * t,
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  // 過衝：s 越大衝得越遠。預設約過衝 10%。
  inBack: (t: number, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
  outBack: (t: number, s = 1.70158) =>
    1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) +
          1,
  // 閉式彈簧：bounce 0 到 1，越大彈得越多。
  spring: (t: number, bounce = 0.25) => {
    const w = 8 + 8 * (1 - bounce);
    return 1 - Math.exp(-6 * t) * Math.cos(w * t * bounce * 2.2);
  },
} as const;

export const lerp = (t: number, a: number, b: number): number =>
  a + (b - a) * t;

// 分段進度：t 在 [t0, t1] 內正規化成 0..1 再過緩動，超出範圍就夾住。
export const seg = (
  t: number,
  t0: number,
  t1: number,
  ease: Ease = E.linear,
): number => ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));

// Remotion interpolate 的兩端夾住選項。
export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// 關鍵格內插，兩端夾住。input 是時間點，output 是對應的值。
export const ip = (
  t: number,
  input: number[],
  output: number[],
  easing?: Ease,
): number => interpolate(t, input, output, { ...CLAMP, easing });
