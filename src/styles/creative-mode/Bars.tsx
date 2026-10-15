import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import type { Aspect, BarsCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { useCardSec } from "./transitions";
import { clamp, pop, slam } from "./motion";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW } from "./tokens";

const FIRST_SEC = 1.0;
const TAIL_SEC = 1.5; // 最後一條長完後留給觀眾讀的時間
const FILL_SEC = 0.5; // 量表從 0 長到定值的時間
const GAP = 40;

const FILL = {
  blue: COLORS.accent2,
  accent: COLORS.accent,
  warn: COLORS.warn,
} as const;

// 量表卡：幾條條紋量表上下排列，比的是相對長短。沒有數字，只當示意（Creative Mode：不得編造數據）。
// 每一條在自己的時間長出來，名牌先拍入，長完後名次彈出。
export const Bars: React.FC<{ card: BarsCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cardSec = useCardSec();
  const t = frame / fps;
  const vertical = aspect === "9:16";
  const n = Math.max(1, card.rows.length);

  const margin = vertical ? 48 : 96;
  const areaTop = vertical ? 420 : 200;
  const areaH = height - areaTop - (vertical ? 220 : 80);
  const rowH = Math.min(160, (areaH - GAP * (n - 1)) / n);
  const top = areaTop + (areaH - (rowH * n + GAP * (n - 1))) / 2;
  const labelW = vertical ? 300 : 450; // 名牌欄
  const trackX = margin + labelW;
  const trackW = width - margin - trackX;
  const barH = rowH * 0.62;

  const span = cardSec - FIRST_SEC - TAIL_SEC;
  const rowAt = card.rows.map((r, i) => r.at ?? FIRST_SEC + (span * i) / n);

  return (
    <CardFrame title={card.title} margin={margin}>
      {card.rows.map((row, i) => {
        const at = rowAt[i];
        const tag = slam(t - at);
        if (tag.x === 0) return null;
        const cy = top + (rowH + GAP) * i + rowH / 2;
        const grown = interpolate(t, [at + 0.15, at + 0.15 + FILL_SEC], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        const fillW = trackW * row.value * grown;
        const color = FILL[row.tone ?? "blue"];
        const rot = (seeded(`bar-${i}`)() - 0.5) * 4;
        return (
          <div key={row.label}>
            {/* 名牌 */}
            <div
              style={{
                position: "absolute",
                left: margin,
                top: cy - 50,
                width: labelW - 40,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  background: COLORS.yellow,
                  color: COLORS.ink,
                  fontFamily: FONT_CJK,
                  fontWeight: 900,
                  fontSize: vertical ? 40 : 54,
                  lineHeight: 1.2,
                  padding: "0.15em 0.5em",
                  whiteSpace: "nowrap",
                  border: `${INK_STROKE}px solid ${COLORS.ink}`,
                  boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                  transformOrigin: "right center",
                  transform: `rotate(${rot}deg) scale(${tag.x}, ${tag.y})`,
                }}
              >
                {row.label}
              </div>
            </div>

            {/* 條紋量表 */}
            {fillW > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: trackX,
                  top: cy - barH / 2,
                  width: fillW,
                  height: barH,
                  boxSizing: "border-box",
                  backgroundColor: color,
                  backgroundImage: `repeating-linear-gradient(-45deg, transparent 0 22px, ${COLORS.surface}88 22px 44px)`,
                  border: `${INK_STROKE}px solid ${COLORS.ink}`,
                  boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                }}
              />
            ) : null}

            {/* 名次與附註，跟在量表尾端 */}
            <div
              style={{
                position: "absolute",
                left: trackX + trackW * row.value + 32,
                top: cy - 40,
                height: 80,
                display: "flex",
                alignItems: "center",
                gap: 20,
                fontFamily: FONT_CJK,
                fontWeight: 900,
                color: COLORS.ink,
                whiteSpace: "nowrap",
              }}
            >
              {row.rank ? (
                <div
                  style={{
                    fontSize: vertical ? 40 : 56,
                    transformOrigin: "left center",
                    transform: `scale(${pop(t - at - 0.15 - FILL_SEC)})`,
                  }}
                >
                  {row.rank}
                </div>
              ) : null}
              {row.note ? (
                <div
                  style={{
                    background: COLORS.ink,
                    color: COLORS.yellow,
                    fontSize: 36,
                    padding: "4px 18px",
                    transformOrigin: "left center",
                    transform: `rotate(-2deg) scale(${pop(t - (row.noteAt ?? at + 1))})`,
                  }}
                >
                  {row.note}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </CardFrame>
  );
};
