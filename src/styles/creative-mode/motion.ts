import { interpolate } from "remotion";
import { CLAMP } from "../../lib/easing";

// Creative Mode 的共用動態：全部只依時間（秒）計算。
export const clamp = CLAMP;

// 回彈式放大：0 → 1.08 → 1。t 是從出現那一刻起算的秒數。
export const pop = (t: number): number =>
  interpolate(t, [0, 0.12, 0.2], [0, 1.08, 1], clamp);

// 拍入：從大縮放落下，壓扁後回彈。回傳橫向與縱向的縮放；出現之前是 0。
export const slam = (t: number): { x: number; y: number } => {
  if (t < 0) return { x: 0, y: 0 };
  const s = interpolate(t, [0, 0.16, 0.22, 0.3], [2.3, 0.9, 1.05, 1], clamp);
  const squash = interpolate(t, [0.16, 0.22, 0.3], [0.86, 1.04, 1], clamp);
  return { x: s, y: s * squash };
};
