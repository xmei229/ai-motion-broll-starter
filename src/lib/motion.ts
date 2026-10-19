// 有速度的關鍵格：讓一個東西「穿過」關鍵格繼續動，而不是每到一格就停下來再起步。
// 用在跨兩張卡的動作（轉場的前景板、跳接的推近），兩邊各算各的，但在接點的位置與速度都一樣。
//
// 觀念參考 vibe-knowledge-film 的 motion-kit（MiniMax Design，沒有附授權檔，所以沒有搬它的程式）；
// 這裡是自己寫的三次 Hermite 內插，數學是教科書內容。全部是純函式，只依賴傳入的時間。
//
// 和 easing.ts 的分工：easing.ts 是「0 到 1 的進度怎麼走」，一段動作從頭到尾用一條曲線；
// 這裡是「好幾個關鍵格、每格指定速度」，要讓動作在接點不斷速時才用。

// 一個關鍵格：t 秒時值是 v，速度是 d（每秒變化量）。
// d 不寫：中間的格用前後兩格估一個速度（Catmull-Rom），讓動作穿過去；頭尾兩格不寫就是 0（從靜止起步、停到靜止）。
// 要在某格刻意停住（閱讀停留），就明寫 d: 0。
export type MotionKey = { t: number; v: number; d?: number };

export type Track = {
  at: (t: number) => number; // 這個時間的值
  vel: (t: number) => number; // 這個時間的速度
  keys: Required<MotionKey>[]; // 補完速度後的關鍵格，給檢查用
};

// 三次 Hermite：從 (t0, p0, 速度 m0) 走到 (t1, p1, 速度 m1)。速度以「每秒」計，
// 所以兩段共用一個關鍵格時，位置與速度都會接上。
const hermite = (
  t: number,
  t0: number,
  t1: number,
  p0: number,
  p1: number,
  m0: number,
  m1: number,
): { p: number; v: number } => {
  const h = t1 - t0;
  const u = (t - t0) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return {
    p:
      (2 * u3 - 3 * u2 + 1) * p0 +
      (u3 - 2 * u2 + u) * h * m0 +
      (-2 * u3 + 3 * u2) * p1 +
      (u3 - u2) * h * m1,
    v:
      ((6 * u2 - 6 * u) / h) * p0 +
      (3 * u2 - 4 * u + 1) * m0 +
      ((-6 * u2 + 6 * u) / h) * p1 +
      (3 * u2 - 2 * u) * m1,
  };
};

// 關鍵格軌道。第一格之前、最後一格之後，照頭尾的速度直線延伸（速度是 0 就是停在那裡）。
export const track = (input: MotionKey[]): Track => {
  const src = [...input].sort((a, b) => a.t - b.t);
  const n = src.length;
  if (n === 0) throw new Error("track 至少要一個關鍵格");
  const keys: Required<MotionKey>[] = src.map((k, i) => {
    if (k.d !== undefined) return { t: k.t, v: k.v, d: k.d };
    if (i === 0 || i === n - 1) return { t: k.t, v: k.v, d: 0 };
    const a = src[i - 1];
    const b = src[i + 1];
    return { t: k.t, v: k.v, d: (b.v - a.v) / (b.t - a.t) };
  });
  const state = (t: number): { p: number; v: number } => {
    const first = keys[0];
    const last = keys[n - 1];
    if (n === 1 || t <= first.t)
      return { p: first.v + first.d * (t - first.t), v: first.d };
    if (t >= last.t) return { p: last.v + last.d * (t - last.t), v: last.d };
    let i = 0;
    while (i < n - 2 && t >= keys[i + 1].t) i++;
    const a = keys[i];
    const b = keys[i + 1];
    return hermite(t, a.t, b.t, a.v, b.v, a.d, b.d);
  };
  return { at: (t) => state(t).p, vel: (t) => state(t).v, keys };
};

// 接力：同一個東西依序沿好幾條軌道走。parts 依時間排，每段在 [from, to] 內照自己的軌道；
// 兩段之間的空檔用 Hermite 補起來，兩頭的位置與速度都對上，所以交棒時不會停一下再走。
// 要讓「同一個道具從上一張卡帶到下一張卡」時用；不要讓一個淡出、另一個淡入。
export const relay = (
  parts: { track: Track; from: number; to: number }[],
): Track => {
  if (parts.length === 0) throw new Error("relay 至少要一段");
  const state = (t: number): { p: number; v: number } => {
    for (let i = 0; i < parts.length; i++) {
      const cur = parts[i];
      const next = parts[i + 1];
      if (!next || t <= cur.to)
        return { p: cur.track.at(t), v: cur.track.vel(t) };
      if (t < next.from)
        return hermite(
          t,
          cur.to,
          next.from,
          cur.track.at(cur.to),
          next.track.at(next.from),
          cur.track.vel(cur.to),
          next.track.vel(next.from),
        );
    }
    const last = parts[parts.length - 1];
    return { p: last.track.at(t), v: last.track.vel(t) };
  };
  return {
    at: (t) => state(t).p,
    vel: (t) => state(t).v,
    keys: parts.flatMap((p) => p.track.keys),
  };
};
