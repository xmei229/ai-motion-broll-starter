// Creative Mode 的卡片轉場：每張卡自己管「進」（開頭）與「出」（結尾），前後兩張卡不必重疊。
// 動作來源：video-shotcraft 的鏡頭卡（Apache License 2.0，commit 5ddbf52，2026-09-28）。
//   push   ← bottom-push-stack-wipe：改成往左推；去掉接縫陰影（這個風格只用硬偏移陰影）；
//            出場用 inCubic（讓位），進場用 outQuart（落位），不是同一條曲線。
//   blocks ← color-block-step-wipe：保留「零緩動、逐格硬跳」；改成一整條色塊從左吃到右、
//            從右退開；色塊用 黃色加墨線。
//   doors  ← page-turn-transitions（barn-door-split）：原卡是舊頁裂成兩半滑出，
//            這裡改成兩扇門從左右合上／打開，避免把卡片內容渲兩份（Icons 會重複讀檔）。
//   iris   ← circle-match-iris：只取光圈的 clip 機制，沒有「圓對圓」的配對；圓心可由 props 指定。
//   carry  ← line-carry-transition：一條線從上一張卡的元件延伸出去，帶著內容往左，
//            再接進下一張卡的元件；表示「上游帶出下游」的因果。原卡的直角拐彎與圍框沒做，
//            改成水平的一條線；線頭與接點的高度（anchor 的 y）前後兩張卡要一樣。
//   dots   ← 半調網點由一點長大蓋滿（原本就在 CardFrame）。
// 時間全以秒計，格數由幀率換算；卡片參數以 30fps 為準。
import { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { E, seg } from "../../lib/easing";
import type { TransitionName } from "../../lib/types";
import { COLORS, INK_STROKE, SHADOW } from "./tokens";

export type TransitionSetting = {
  intro: TransitionName;
  outro: TransitionName;
  anchor: [number, number]; // 出場的錨點
  anchorIn?: [number, number]; // 進場的錨點；沒寫就用 anchor
  totalSec?: number; // 這張卡的長度；在 Sequence 裡不能靠 useVideoConfig 取得，由 Film 給
};

export const DEFAULT_TRANSITION: TransitionSetting = {
  intro: "dots",
  outro: "none",
  anchor: [0.5, 0.5],
};

export const TransitionContext = createContext<TransitionSetting>(DEFAULT_TRANSITION);
export const useTransition = (): TransitionSetting => useContext(TransitionContext);

// 每種轉場的出場與進場時長（秒）。轉場之間要留給內容的時間，卡片至少比兩者相加再長一點。
export const TRANSITION_SEC: Record<
  Exclude<TransitionName, "none">,
  { out: number; in: number }
> = {
  dots: { out: 0.26, in: 0.33 },
  push: { out: 0.4, in: 0.6 },
  blocks: { out: 0.55, in: 0.55 },
  doors: { out: 0.45, in: 0.5 },
  iris: { out: 0.45, in: 0.55 },
  carry: { out: 0.9, in: 0.85 },
};

const CARRY_TIP = 0.78; // 線頭停在畫面 78% 處，不出畫（原卡：居中像線在追鏡頭，貼邊會出畫）
const CARRY_DRAW = 0.4; // 出場前 40% 畫線，後 60% 推內容
const CARRY_ARRIVE = 0.6; // 進場前 60% 內容落位，後 40% 線縮回

// blocks 的階梯：[進度門檻, 蓋住的比例]。進度越過門檻就硬跳，不插值；間隔刻意不等距。
export const BLOCK_STEPS: [number, number][] = [
  [0, 0],
  [0.05, 0.25],
  [0.33, 0.52],
  [0.58, 0.78],
  [0.85, 1],
];
const stepVal = (p: number, steps: [number, number][]): number => {
  let v = steps[0][1];
  for (const [t, val] of steps) {
    if (p >= t) v = val;
  }
  return v;
};

// 目前這一格，進場與出場各自的「蓋住程度」：0 是全清，1 是全蓋。
// push 沒有「蓋住」，用 pushX 取位移。
export const useTransitionPhase = (
  introName: TransitionName,
  outroName: TransitionName,
  totalSec?: number,
) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const total = totalSec ?? durationInFrames / fps;
  const inDur = introName === "none" ? 0 : TRANSITION_SEC[introName].in;
  const outDur = outroName === "none" ? 0 : TRANSITION_SEC[outroName].out;
  // 進場進度 0→1；出場進度 0→1（從結尾倒數 outDur 秒開始）
  const inP = inDur > 0 ? Math.min(1, Math.max(0, t / inDur)) : 1;
  const outP =
    outDur > 0 ? Math.min(1, Math.max(0, (t - (total - outDur)) / outDur)) : 0;
  return { inP, outP };
};

// 內容在這一格要加的水平位移（px）。
// push：出場加速往左離開（inCubic），進場從右邊減速落位（outQuart）。
// carry：出場先畫線，再與線同步往左離開（inOutCubic）；進場往左落位（outCubic）。
export const contentShift = (
  introName: TransitionName,
  outroName: TransitionName,
  inP: number,
  outP: number,
  width: number,
): number => {
  let x = 0;
  if (outroName === "push") x -= width * E.inCubic(outP);
  if (outroName === "carry")
    x -= width * seg(outP, CARRY_DRAW, 1, E.inOutCubic);
  if (introName === "push") x += width * (1 - E.outQuart(inP));
  if (introName === "carry")
    x += width * (1 - seg(inP, 0, CARRY_ARRIVE, E.outCubic));
  return x;
};

const Blocks: React.FC<{ c: number; side: "left" | "right" }> = ({ c, side }) => {
  const { width } = useVideoConfig();
  const w = Math.round(width * c);
  if (w <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: w,
        background: COLORS.yellow,
        // 前緣一條墨線，加硬偏移陰影；全蓋時不畫陰影
        [side === "left" ? "borderRight" : "borderLeft"]:
          c < 1 ? `${INK_STROKE}px solid ${COLORS.ink}` : "none",
        boxShadow:
          c < 1
            ? `${side === "left" ? SHADOW : -SHADOW}px 0 0 ${COLORS.ink}`
            : "none",
        boxSizing: "border-box",
      }}
    />
  );
};

const Doors: React.FC<{ c: number }> = ({ c }) => {
  const { width } = useVideoConfig();
  const half = Math.round((width / 2) * c);
  if (half <= 0) return null;
  const door = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    bottom: 0,
    [side]: 0,
    width: half,
    backgroundColor: COLORS.accent2,
    backgroundImage: `radial-gradient(circle, ${COLORS.surface}55 22%, transparent 24%)`,
    backgroundSize: "28px 28px",
    [side === "left" ? "borderRight" : "borderLeft"]:
      c < 1 ? `${INK_STROKE}px solid ${COLORS.ink}` : "none",
    boxSizing: "border-box",
  });
  return (
    <>
      <div style={door("left")} />
      <div style={door("right")} />
    </>
  );
};

const Iris: React.FC<{ c: number; anchor: [number, number] }> = ({ c, anchor }) => {
  const { width, height } = useVideoConfig();
  if (c <= 0) return null;
  const cx = anchor[0] * width;
  const cy = anchor[1] * height;
  // 圓洞要大到蓋過最遠的那個角
  const far = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(width - cx, cy),
    Math.hypot(cx, height - cy),
    Math.hypot(width - cx, height - cy),
  );
  if (c >= 1) return <AbsoluteFill style={{ background: COLORS.ink }} />;
  const r = Math.round(far * (1 - c));
  const ring = INK_STROKE + 2;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, ${COLORS.yellow} ${r}px, ${COLORS.yellow} ${r + ring}px, ${COLORS.ink} ${r + ring}px)`,
      }}
    />
  );
};


// 延伸線：一條墨線加箭頭。出場時由 anchor 往右畫到線頭，再與內容一起往左；
// 進場時線從畫面左緣拉到新內容的接點，內容落位後線從左端縮回接點、消失。
const Carry: React.FC<{
  phase: "in" | "out";
  progress: number;
  anchor: [number, number];
}> = ({ phase, progress, anchor }) => {
  const { width, height } = useVideoConfig();
  const ax = anchor[0] * width;
  const y = anchor[1] * height;
  const tipX = CARRY_TIP * width;
  let left: number;
  let right: number;
  if (phase === "out") {
    const draw = seg(progress, 0, CARRY_DRAW, E.outCubic);
    const shift = -width * seg(progress, CARRY_DRAW, 1, E.inOutCubic);
    left = Math.max(0, ax + shift);
    right = progress < CARRY_DRAW ? ax + (tipX - ax) * draw : tipX;
  } else {
    const shift = width * (1 - seg(progress, 0, CARRY_ARRIVE, E.outCubic));
    right = Math.min(tipX, ax + shift);
    left = right * seg(progress, CARRY_ARRIVE, 1, E.inOutCubic);
  }
  const len = right - left;
  if (len <= 1) return null;
  const head = Math.min(1, len / 80); // 線很短時箭頭跟著縮
  const hw = 26 * head;
  const hh = 18 * head;
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <line
          x1={left}
          y1={y}
          x2={right - hw * 0.6}
          y2={y}
          stroke={COLORS.ink}
          strokeWidth={INK_STROKE}
          strokeLinecap="round"
        />
        <polygon
          points={`${right},${y} ${right - hw},${y - hh} ${right - hw},${y + hh}`}
          fill={COLORS.accent}
          stroke={COLORS.ink}
          strokeWidth={INK_STROKE - 2}
          strokeLinejoin="round"
        />
      </svg>
    </AbsoluteFill>
  );
};

// 蓋在卡片上面的那一層。cover 型的轉場與 carry 的線都在這裡畫；push 不蓋東西，由 CardFrame 移動內容。
// progress：進場傳 inP，出場傳 outP。
export const CoverLayer: React.FC<{
  name: TransitionName;
  phase: "in" | "out";
  progress: number;
  anchor: [number, number];
}> = ({ name, phase, progress, anchor }) => {
  if (name === "none" || name === "push") return null;
  if (name === "carry") {
    if (phase === "out" ? progress <= 0 : progress >= 1) return null;
    return <Carry phase={phase} progress={progress} anchor={anchor} />;
  }
  // c：蓋住的程度。出場由 0 長到 1，進場由 1 退到 0。
  const p = phase === "out" ? progress : 1 - progress;
  if (phase === "out" && progress <= 0) return null;
  if (phase === "in" && progress >= 1) return null;
  switch (name) {
    case "dots": {
      const wipe = 100 * p;
      if (wipe <= 0) return null;
      return (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${COLORS.accent} ${wipe}%, transparent ${wipe}%)`,
            backgroundSize: "96px 96px",
          }}
        />
      );
    }
    case "blocks":
      return (
        <Blocks c={stepVal(p, BLOCK_STEPS)} side={phase === "out" ? "left" : "right"} />
      );
    case "doors":
      return <Doors c={E.inOutCubic(p)} />;
    case "iris":
      return <Iris c={E.inOutCubic(p)} anchor={anchor} />;
  }
};

// 這張卡有多長（秒）。單卡渲染時等於整支片長；放在整片的 Sequence 裡時由 Film 給。
// 卡片排版（把各列平均分在片長內）要用這個，不要直接用 useVideoConfig 的 durationInFrames。
export const useCardSec = (): number => {
  const { fps, durationInFrames } = useVideoConfig();
  const { totalSec } = useTransition();
  return totalSec ?? durationInFrames / fps;
};
