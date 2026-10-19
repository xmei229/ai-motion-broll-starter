import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import { secToFrame } from "../../lib/time";
import type { Aspect, CompareCard, CompareSide } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { Label } from "./Label";
import { useCardSec } from "./transitions";
import { Lead } from "./Lead";
import { clamp, pop, slam } from "./motion";
import { Sticker } from "./Sticker";
import {
  COLORS,
  FONT_CJK,
  FONT_DISPLAY,
  INK_STROKE,
  SHADOW,
  SIZE,
} from "./tokens";

const HEAD_LEFT_SEC = 0.35;
const HEAD_RIGHT_SEC = 0.6;
const VS_SEC = 0.85;
const FIRST_ROW_SEC = 1.4;
const TAIL_SEC = 1.5; // 最後一列拍入後留給觀眾讀的時間
const CELL_LAG_SEC = 0.12; // 右格比左格晚一點落下
const CELL_SIZE = 44;
const FOREVER = 1e6;

// 有種子的星爆外框。
const burstPoints = (seedKey: string, n: number, outer: number, inner: number) => {
  const rng = seeded(seedKey);
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = (i % 2 ? inner : outer) * (0.9 + rng() * 0.2);
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
};

// 對照卡：左右兩塊面板對立，中間一欄是比較項目；每一列在自己的時間拍入。
export const Compare: React.FC<{ card: CompareCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cardSec = useCardSec();
  const t = frame / fps;
  const vertical = aspect === "9:16";

  const margin = vertical ? 48 : 96;
  const mid = vertical ? 220 : 290; // 中間比較項目欄的寬度
  const panelW = (width - margin * 2 - mid) / 2;
  const panelTop = vertical ? 420 : 250;
  const panelH = height - panelTop - (vertical ? 200 : 70);
  const rowsTop = panelTop + 165;
  const cellSize = card.rows.length <= 2 ? 56 : CELL_SIZE; // 列少的時候字放大，把面板撐滿
  const pitch = (panelH - 185) / Math.max(1, card.rows.length);

  const span = cardSec - FIRST_ROW_SEC - TAIL_SEC;
  const rowAt = card.rows.map(
    (r, i) => r.at ?? FIRST_ROW_SEC + (span * i) / Math.max(1, card.rows.length),
  );
  // 每個節拍只有一個粉色重點：最新拍入的那一列。
  const newest = rowAt.reduce((n, at, i) => (t >= at ? i : n), -1);

  // 有開場主題時，主題先獨佔畫面，退場的那一刻兩塊面板才拍入。
  const lead = card.lead;
  const panelIn = lead ? slam(t - lead.until) : null;

  const panel = (left: number): React.CSSProperties => ({
    position: "absolute",
    left,
    top: panelTop,
    width: panelW,
    height: panelH,
    boxSizing: "border-box",
    background: COLORS.surface,
    border: `${INK_STROKE}px solid ${COLORS.ink}`,
    boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
    transform: panelIn ? `scale(${panelIn.x}, ${panelIn.y})` : undefined,
  });
  // 標題與副標各有自己的時間；沒給就用預設的開場節奏。
  const side = (s: CompareSide, x: number, fallback: number, from: number) => {
    const at = s.at ?? fallback;
    return { ...s, x, at, subAt: s.subAt ?? at + 0.2, from };
  };
  const sides = [
    side(card.left, margin, HEAD_LEFT_SEC, -1),
    side(card.right, margin + panelW + mid, HEAD_RIGHT_SEC, 1),
  ];

  return (
    <CardFrame title={card.title} margin={margin}>
        {lead ? (
          <Lead lead={lead} cx={width / 2} cy={panelTop + panelH / 2 - 20} />
        ) : null}

        {sides.map((s) => (
          <div key={s.x}>
            <div style={panel(s.x)} />
            <div
              style={{
                position: "absolute",
                left: s.x,
                top: panelTop - 52,
                width: panelW,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Sticker
                text={s.title}
                at={secToFrame(s.at, fps)}
                holdFrames={FOREVER}
                seedKey={`head-${s.title}`}
                fontSize={SIZE.h1}
              />
            </div>
            {s.sub ? (
              <div
                style={{
                  position: "absolute",
                  left: s.x,
                  top: panelTop + 112,
                  width: panelW,
                  textAlign: "center",
                  fontFamily: FONT_CJK,
                  fontWeight: 900,
                  fontSize: SIZE.label,
                  color: COLORS.muted,
                  transform: `scale(${pop(t - s.subAt)})`,
                }}
              >
                {s.sub}
              </div>
            ) : null}
          </div>
        ))}

        {/* 中央的 VS 星爆 */}
        <div
          style={{
            position: "absolute",
            left: width / 2,
            top: panelTop + 10,
            transform: `scale(${pop(t - (card.markAt ?? VS_SEC))}) rotate(-8deg)`,
          }}
        >
          <svg
            width={320}
            height={320}
            viewBox="-160 -160 320 320"
            style={{ position: "absolute", left: -160, top: -160 }}
          >
            <polygon
              points={burstPoints("vs", 14, 128, 92)}
              fill={COLORS.ink}
              transform={`translate(${SHADOW} ${SHADOW})`}
            />
            <polygon
              points={burstPoints("vs", 14, 128, 92)}
              fill={COLORS.yellow}
              stroke={COLORS.ink}
              strokeWidth={INK_STROKE}
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              left: -160,
              top: -62,
              width: 320,
              textAlign: "center",
              fontFamily: FONT_DISPLAY,
              fontSize: 104,
              lineHeight: 1,
              color: COLORS.ink,
            }}
          >
            {card.mark ?? "VS"}
          </div>
        </div>

        {card.rows.map((row, i) => {
          const at = rowAt[i];
          const rightAt = row.rightAt ?? at + CELL_LAG_SEC; // 右格可以等到自己被唸到才落下
          if (t < Math.min(at, rightAt)) return null;
          const y = rowsTop + pitch * (i + 0.5);
          const rot = (seeded(`row-${i}`)() - 0.5) * 6;
          const cell = (side: (typeof sides)[number], text: string) => {
            const lt = t - (side.from > 0 ? rightAt : at);
            const slide = interpolate(lt, [0, 0.16], [48 * side.from, 0], clamp);
            return (
              <div
                style={{
                  position: "absolute",
                  left: side.x,
                  top: y - 34,
                  width: panelW,
                  textAlign: "center",
                  fontFamily: FONT_CJK,
                  fontWeight: 900,
                  fontSize: cellSize,
                  lineHeight: "68px",
                  color: COLORS.ink,
                  transform: `translateX(${slide}px) scale(${pop(lt)})`,
                }}
              >
                {text}
              </div>
            );
          };
          return (
            <div key={`${i}-${row.left}`}>
              {/* 分隔線跟著這一列一起出現 */}
              {i > 0
                ? sides.map((s) => (
                    <div
                      key={s.x}
                      style={{
                        position: "absolute",
                        left: s.x + 36,
                        top: y - pitch / 2 - 1,
                        width: panelW - 72,
                        height: 3,
                        background: COLORS.muted,
                        transformOrigin: s.from < 0 ? "left" : "right",
                        transform: `scaleX(${interpolate(t - (s.from > 0 ? rightAt : at), [0, 0.2], [0, 1], clamp)})`,
                      }}
                    />
                  ))
                : null}
              {cell(sides[0], row.left)}
              {cell(sides[1], row.right)}
              {row.label ? (
                <div
                  style={{
                    position: "absolute",
                    left: margin + panelW,
                    top: y - 30,
                    width: mid,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      background: i === newest ? COLORS.accent : COLORS.ink,
                      color: i === newest ? COLORS.ink : COLORS.bg,
                      border: `${INK_STROKE - 2}px solid ${COLORS.ink}`,
                      boxShadow: `${SHADOW - 3}px ${SHADOW - 3}px 0 ${COLORS.ink}`,
                      padding: "6px 20px",
                      fontFamily: FONT_CJK,
                      fontWeight: 900,
                      fontSize: SIZE.label,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      transform: `rotate(${rot}deg) scale(${pop(t - at)})`,
                    }}
                  >
                    {row.label}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      {(card.stickers ?? []).map((s, i) => {
        const k = slam(t - s.at);
        if (k.x === 0) return null;
        return (
          <Label
            key={`${s.text}-${i}`}
            sticker={s}
            left={s.x}
            top={s.y}
            rot={(seeded(`compare-label-${i}`)() - 0.5) * 8}
            scale={k}
          />
        );
      })}
    </CardFrame>
  );
};
