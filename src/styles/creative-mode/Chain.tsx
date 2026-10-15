import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import { secToFrame } from "../../lib/time";
import type { Aspect, ChainCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { useCardSec } from "./transitions";
import { Lead } from "./Lead";
import { LottieClip } from "./LottieClip";
import { NoteBox } from "./NoteBox";
import { clamp, pop, slam } from "./motion";
import {
  COLORS,
  FONT_CJK,
  FONT_DISPLAY,
  INK_STROKE,
  SHADOW,
} from "./tokens";

const FIRST_STEP_SEC = 0.6;
const TAIL_SEC = 1.5; // 最後一步拍入後留給觀眾讀的時間
const DRAW_SEC = 0.3; // 箭頭畫到這一步的時間；畫到底的那一刻這一步拍入
const ARROW_GAP = 120;
const LANE_GAP = 140; // 兩條鏈之間留給鏈名的空間
const HEAD = 26; // 箭頭尖的大小

// 鏈卡：由左到右一步接一步；箭頭畫到哪一步，那一步就在自己的時間拍入。
// 可以上下排幾條鏈（lanes）並列對照，每條有自己的名字。
export const Chain: React.FC<{ card: ChainCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cardSec = useCardSec();
  const t = frame / fps;
  const vertical = aspect === "9:16";
  const lanes = card.lanes ?? [{ steps: card.steps ?? [] }];
  const single = lanes.length === 1;
  const n = Math.max(1, ...lanes.map((l) => l.steps.length));
  const total = Math.max(
    1,
    lanes.reduce((k, l) => k + l.steps.length, 0),
  );

  const margin = vertical ? 48 : 96;
  const boxW = (width - margin * 2 - ARROW_GAP * (n - 1)) / n;
  const boxH = single ? 420 : vertical ? 300 : 250;
  const center = height / 2 + (single ? 50 : 70);
  const laneCy = (l: number) =>
    center + (l - (lanes.length - 1) / 2) * (boxH + LANE_GAP);
  const titleSize = single ? (n <= 3 ? 60 : 46) : 52;
  const noteSize = single ? (n <= 3 ? 42 : 32) : 34;
  const disc = single ? 116 : 92;
  const left = (i: number) => margin + (boxW + ARROW_GAP) * i;

  // 沒給秒數的步，照「一條鏈接一條鏈」的順序在片長內等間隔。
  const span = cardSec - FIRST_STEP_SEC - TAIL_SEC;
  const offsets = lanes.map((_, l) =>
    lanes.slice(0, l).reduce((k, lane) => k + lane.steps.length, 0),
  );
  const at = lanes.map((lane, l) =>
    lane.steps.map(
      (s, i) => s.at ?? FIRST_STEP_SEC + (span * (offsets[l] + i)) / total,
    ),
  );
  // 每個節拍只有一個粉色重點：全卡最新拍入的那一步。
  const newest = at.reduce(
    (best, row, l) =>
      row.reduce(
        (b, a, i) => (t >= a && a >= b.at ? { lane: l, step: i, at: a } : b),
        best,
      ),
    { lane: -1, step: -1, at: -Infinity },
  );

  return (
    <CardFrame title={card.title} margin={margin} intro={card.intro}>
      {card.lead ? <Lead lead={card.lead} cx={width / 2} cy={center} /> : null}

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {lanes.map((lane, l) =>
          lane.steps.map((s, i) => {
            if (i === 0) return null;
            // 兩端的步都到了，箭頭才畫
            const ready = Math.max(at[l][i - 1], at[l][i]);
            const drawn = interpolate(
              t,
              [ready - DRAW_SEC, ready],
              [0, 1],
              clamp,
            );
            if (drawn <= 0 || s.op) return null;
            const cy = laneCy(l);
            const x0 = left(i - 1) + boxW + 18;
            const tip = x0 + (left(i) - 18 - x0) * drawn;
            return (
              <g key={`${l}-${s.title}`}>
                <line
                  x1={x0}
                  y1={cy}
                  x2={Math.max(x0, tip - HEAD)}
                  y2={cy}
                  stroke={COLORS.ink}
                  strokeWidth={INK_STROKE + 4}
                  strokeLinecap="round"
                />
                <polygon
                  points={`${tip},${cy} ${tip - HEAD},${cy - HEAD} ${tip - HEAD},${cy + HEAD}`}
                  fill={COLORS.ink}
                />
              </g>
            );
          }),
        )}
      </svg>

      {lanes.map((lane, l) => {
        const cy = laneCy(l);
        const label = slam(t - (lane.at ?? Math.min(...at[l]) - 0.3));
        return (
          <div key={lane.label ?? l}>
            {lane.label && label.x > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: margin + disc,
                  top: cy - boxH / 2 - 78,
                  background: COLORS.yellow,
                  color: COLORS.ink,
                  fontFamily: FONT_CJK,
                  fontWeight: 900,
                  fontSize: 44,
                  lineHeight: 1.2,
                  padding: "0.12em 0.5em",
                  border: `${INK_STROKE}px solid ${COLORS.ink}`,
                  boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                  transformOrigin: "left center",
                  transform: `rotate(-2deg) scale(${label.x}, ${label.y})`,
                }}
              >
                {lane.label}
              </div>
            ) : null}

            {lane.steps.map((s, i) =>
              s.op && i > 0 ? (
                <div
                  key={`op-${s.title}`}
                  style={{
                    position: "absolute",
                    left: left(i) - ARROW_GAP,
                    top: cy - 70,
                    width: ARROW_GAP,
                    textAlign: "center",
                    fontFamily: FONT_CJK, // Bangers 的加號等號太小，改用黑體
                    fontWeight: 900,
                    fontSize: 132,
                    lineHeight: "140px",
                    color: COLORS.ink,
                    transform: `scale(${pop(t - Math.max(at[l][i - 1], at[l][i]) + 0.15)})`,
                  }}
                >
                  {s.op}
                </div>
              ) : null,
            )}

            {lane.steps.map((s, i) => {
              const k = slam(t - at[l][i]);
              if (k.x === 0) return null;
              // 第一條鏈沿用原本的種子，已出的片重渲染時角度不變
              const rot =
                (seeded(l ? `step-${l}-${i}` : `step-${i}`)() - 0.5) * 4;
              const hot = newest.lane === l && newest.step === i;
              const warn = s.tone === "warn"; // 缺少的、代價：用警示色
              return (
                <div
                  key={s.title}
                  style={{
                    position: "absolute",
                    left: left(i),
                    top: cy - boxH / 2,
                    width: boxW,
                    height: boxH,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: s.lottie ? 4 : single ? 20 : 8,
                    padding: s.lottie && !s.title ? 0 : single ? "24px 28px 0" : "8px 24px 0",
                    background: COLORS.surface,
                    border: `${INK_STROKE}px solid ${COLORS.ink}`,
                    boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                    fontFamily: FONT_CJK,
                    color: COLORS.ink,
                    textAlign: "center",
                    transform: `rotate(${rot}deg) scale(${k.x}, ${k.y})`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      display: s.mark === "" ? "none" : "flex",
                      left: -28,
                      top: -36,
                      width: disc,
                      height: disc,
                      borderRadius: "50%",
                      background: warn
                        ? COLORS.warn
                        : hot
                          ? COLORS.accent
                          : COLORS.ink,
                      color: warn || hot ? COLORS.ink : COLORS.yellow,
                      border: `${INK_STROKE - 2}px solid ${COLORS.ink}`,
                      boxShadow: `${SHADOW - 3}px ${SHADOW - 3}px 0 ${COLORS.ink}`,
                      boxSizing: "border-box",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONT_DISPLAY,
                      fontSize: disc * 0.62,
                      lineHeight: 1,
                    }}
                  >
                    {s.mark ?? i + 1}
                  </div>
                  {s.lottie ? (
                    <LottieClip
                      src={s.lottie}
                      from={secToFrame(at[l][i], fps)}
                      width={boxW - 64}
                      height={boxH - (s.title ? (single ? 150 : 110) : 56)}
                    />
                  ) : null}
                  {s.title ? (
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: s.lottie ? titleSize - 10 : titleSize,
                        lineHeight: 1.25,
                      }}
                    >
                      {s.title}
                    </div>
                  ) : null}
                  {s.note ? (
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: noteSize,
                        lineHeight: 1.3,
                        color: COLORS.muted,
                        whiteSpace: "pre-line", // 說明裡的換行字元是指定的斷行位置
                        transform: `scale(${pop(t - at[l][i] - 0.25)})`,
                      }}
                    >
                      {s.note}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* 蓋在某一步上的貼紙：結論、判定 */}
      {(card.stamps ?? []).map((st) => {
        const k = slam(t - st.at);
        if (k.x === 0) return null;
        const above = st.place === "above";
        const lift = above ? (single ? 190 : 150) : single ? 84 : 88;
        return (
          <div
            key={st.text}
            style={{
              position: "absolute",
              left: left(st.step),
              top: laneCy(st.lane ?? 0) - boxH / 2 - lift,
              width: boxW + (above ? 0 : 90), // 判定貼紙往右偏，不壓住編號與標題
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: st.tone === "warn" ? COLORS.warn : COLORS.yellow,
                color: COLORS.ink,
                fontFamily: FONT_CJK,
                fontWeight: 900,
                fontSize: above ? (single ? 50 : 40) : single ? 96 : 64,
                lineHeight: 1.2,
                padding: "0.15em 0.5em",
                whiteSpace: "nowrap",
                border: `${INK_STROKE}px solid ${COLORS.ink}`,
                boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                transform: `rotate(${above ? 4 : -8}deg) scale(${k.x}, ${k.y})`,
              }}
            >
              {st.text}
            </div>
          </div>
        );
      })}

      {/* 旁白框：放在動作留下的空處 */}
      {card.note ? (
        <NoteBox
          note={card.note}
          right={margin}
          top={laneCy(lanes.length - 1) + boxH / 2 + (single ? 56 : 20)}
          fontSize={single ? 42 : 38}
        />
      ) : null}
    </CardFrame>
  );
};
