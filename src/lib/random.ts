// 有種子的亂數（mulberry32）。同一個 seed 永遠給同一串數字，
// 所以每一幀都能重現。專案內唯一允許產生隨機的地方。
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// 字串 → 32 位元種子（FNV-1a），讓 id 之類的字串也能當種子。
export const hashSeed = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

// 用法：每個元素各自建 rng，與 frame 無關，位置才不會每幀亂跳。
// const rng = seeded("sticker-1"); const x = rng();
export const seeded = (key: string | number): (() => number) =>
  mulberry32(typeof key === "number" ? key : hashSeed(key));
